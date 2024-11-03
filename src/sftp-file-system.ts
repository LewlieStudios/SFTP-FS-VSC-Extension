import * as vscode from 'vscode';
import logger from './logger';
import configuration, { RemoteConfiguration } from './configuration';
import connectionManager from './connection-manager';
import { SFTPWrapper, Stats } from 'ssh2';
import upath from 'upath';
import * as childProcess from 'child_process';
import fileDecorationManager from './file-decoration-manager';

export class SFTPFileSystemProvider implements vscode.FileSystemProvider {
    static sftpFileProvidersByRemotes = new Map<string, SFTPFileSystemProvider>();

    private readonly _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

    remoteName!: string;
    remoteConfiguration!: RemoteConfiguration;
    workDirPath!: vscode.Uri;
    workDirName!: string;
    connectionPromise?: Promise<void>;
    workdDirWatcher!: vscode.FileSystemWatcher;

    private async setupFileSystem(uri: vscode.Uri) {
        if (this.connectionPromise !== undefined) {
            await this.connectionPromise;
            return;
        }

        SFTPFileSystemProvider.sftpFileProvidersByRemotes.set(uri.authority, this);
        this.remoteName = uri.authority;
        this.remoteConfiguration = await configuration.getRemoteConfiguration(this.remoteName) ?? {};
        const current = (await configuration.getWorkDirForRemote(this.remoteName));
        if (current === undefined) {
            throw Error("Working directory not found for this SFTP file provider.");
        }
        this.workDirPath = vscode.Uri.file(current);
        this.workDirName = current.split('/').pop()!;
        this.connectionPromise = this.connect();

        console.log('Creating file watcher...');
        this.workdDirWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(this.workDirPath, '*')
        );

        this.workdDirWatcher.onDidCreate((uri) => {
            console.log('File created: ' + uri.toString());
        });

        this.workdDirWatcher.onDidDelete((uri) => {
            console.log('File deleted: ' + uri.toString());
        });

        this.workdDirWatcher.onDidChange((uri) => {
            console.log('File changed: ' + uri.toString());
        });

        await this.connectionPromise;
    }

    private async connect() {
        if(!connectionManager.isConnectionOpen(this.remoteName)) {
            await connectionManager.connect({
                configuration: this.remoteConfiguration,
                remoteName: this.remoteName
            });
        }
    }

    async getConnection() {
        var connection = connectionManager.getConnection(this.remoteName);
        if (connection === undefined || connection.status === 'CLOSED') {
            // Try to reconnect...
            logger.appendLineToMessages('Connection closed or lost, trying to get new connection...');
            this.connectionPromise = this.connect();
            await this.connectionPromise;
            connection = connectionManager.getConnection(this.remoteName);
        }
        return connection;
    }

    watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[] }): vscode.Disposable {
        this.setupFileSystem(uri);
        return new vscode.Disposable(() => {});
    }

    stat(uri: vscode.Uri): Promise<vscode.FileStat> {
        return new Promise(async (resolve, reject) => {
            if (uri.path === '/') {
                resolve(
                    {
                        type: vscode.FileType.Directory,
                        ctime: Date.now(),
                        mtime: Date.now(),
                        size: 0,
                    }
                );
                return;
            }

            if (!uri.path.startsWith('/' + this.workDirName)) {
                reject(FileSystemErrorBuilder.FileNotFound(uri));
                return;
            }

            try {
                await this.setupFileSystem(uri);
                const realUri = this.resolveRealPath(uri);
                const connection = await this.getConnection();

                if (connection === undefined) {
                    logger.appendLineToMessages('Error when stat file (' + this.remoteName + '): Connection lost.');
                    vscode.window.showErrorMessage('Broken connection to SFTP server.');
                    return;
                }

                try {
                    logger.appendLineToMessages('[stat] ' + realUri.path);
                    connection!.sftp!.lstat(realUri.path, async (err, stats) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        var fileStats = stats;
                        var fileType = this.getFileTypeByStats(fileStats);

                        if (fileType === vscode.FileType.SymbolicLink) {
                            fileStats = await this.followSymbolicLinkAndGetStats(connection!.sftp!, realUri);
                            fileType = this.getFileTypeByStats(fileStats);
                        }

                        // Check local file
                        var calculatedLocalFile = this.workDirPath.with({ path: upath.join(this.workDirPath.fsPath, realUri.path) });
                        const localFileStat = await this.statLocalFileByUri(calculatedLocalFile);
                        if (localFileStat === undefined) {
                            fileDecorationManager.setRemoteFileDecoration(uri);
                        } else {
                            if (localFileStat.type === vscode.FileType.Directory) {
                                fileDecorationManager.setDirectoryFileDecoration(uri);
                            } else {
                                const res = await this.resolveWhatFileIsNewer(localFileStat, fileStats);
                                if (res === 'local_newer') {
                                    fileDecorationManager.setUpToDateFileDecoration(uri);
                                } else if(res === 'remote_newer') {
                                    fileDecorationManager.setRemoteDownloadFileDecoration(uri);
                                } else {
                                    fileDecorationManager.setUnknownStateFileDecoration(uri);
                                }
                            }
                        }

                        resolve({
                            type: fileType,
                            ctime: 0,
                            mtime: fileStats.mtime,
                            size: fileStats.size
                        });
                    });
                } catch(error: any) {
                    if (error.code === ErrorCodes.FILE_NOT_FOUND) {
                        error = FileSystemErrorBuilder.FileNotFound(uri);
                    } else {
                        logger.appendErrorToMessages('Error when stat file (' + this.remoteName + '): ' + realUri.path, error);
                        vscode.window.showErrorMessage(error.message);
                    }
                    throw error;
                }
            } catch(ex: any) {
                reject(ex);
            }
        });
    }

    async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        return new Promise(async (resolve, reject) => {
            try {
                await this.setupFileSystem(uri);

                if (uri.path === '/') {
                    resolve(
                        [
                            [this.workDirName, vscode.FileType.Directory]
                        ]
                    );
                    return;
                }

                if (!uri.path.startsWith('/' + this.workDirName)) {
                    resolve(
                        []
                    );
                    return;
                }

                const realUri = this.resolveRealPath(uri);
                logger.appendLineToMessages('[read-dir] ' + realUri.path);

                const connection = await this.getConnection();
                if (connection === undefined) {
                    throw Error('Broken connection to SFTP server.');
                }

                connection!.sftp!.readdir(realUri.path, async (err, stats) => {
                    if(err) {
                        reject(err);
                        return;
                    }
                    const result: [string, vscode.FileType][] = [];

                    for (const entry of stats) {
                        var entryStats = entry.attrs;
                        var fileType = this.getFileTypeByStats(entryStats);

                        if (fileType === vscode.FileType.SymbolicLink) {
                            entryStats = await this.followSymbolicLinkAndGetStats(connection!.sftp!, realUri.with({ path: upath.join(realUri.path, entry.filename) }));
                            fileType = this.getFileTypeByStats(entryStats);
                        }

                        result.push([entry.filename, fileType]);

                        // Determine if there is a local version of this file.
                        var calculatedLocalFile = this.workDirPath.with({ path: upath.join(this.workDirPath.fsPath, upath.join(realUri.path, entry.filename)) });
                        const localFileStat = await this.statLocalFileByUri(calculatedLocalFile);
                        if (localFileStat === undefined) {
                            fileDecorationManager.setRemoteFileDecoration(realUri.with({ path: upath.join(uri.path, entry.filename) }));
                        } else {
                            if (localFileStat.type === vscode.FileType.Directory) {
                                fileDecorationManager.setDirectoryFileDecoration(realUri.with({ path: upath.join(uri.path, entry.filename) }));
                            } else {
                                const res = await this.resolveWhatFileIsNewer(localFileStat, entryStats);
                                if (res === 'local_newer') {
                                    fileDecorationManager.setUpToDateFileDecoration(realUri.with({ path: upath.join(uri.path, entry.filename) }));
                                } else if(res === 'remote_newer') {
                                    fileDecorationManager.setRemoteDownloadFileDecoration(realUri.with({ path: upath.join(uri.path, entry.filename) }));
                                } else {
                                    fileDecorationManager.setUnknownStateFileDecoration(realUri.with({ path: upath.join(uri.path, entry.filename) }));
                                }
                            }
                        }
                    }

                    resolve(result);
                });
            } catch(ex: any) {
                logger.appendLineToMessages('Cannot read directory (' + this.remoteName + '): ' + ex.message);
                vscode.window.showErrorMessage(ex.message);
                reject(ex);
            }
        });
    }

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        return new Promise(async (resolve, reject) => {
            try {
                await this.setupFileSystem(uri);

                if (uri.path === '/') {
                    resolve(new Uint8Array());
                    return;
                }

                if (!uri.path.startsWith('/' + this.workDirName)) {
                    resolve(new Uint8Array());
                    return;
                }

                const data = await this.downloadRemoteToLocalIfNeeded(uri, true);
                resolve(data!);
            } catch(ex: any) {
                logger.appendLineToMessages('Cannot read file (' + this.remoteName + '): ' + ex.message);
                vscode.window.showErrorMessage(ex.message);
                reject(ex);
            }
        });
    }

    async writeFile(uri: vscode.Uri, content: Uint8Array, options: { readonly create: boolean; readonly overwrite: boolean; }): Promise<void> {
        await this.setupFileSystem(uri);
    }

    async createDirectory(uri: vscode.Uri): Promise<void> {
        await this.setupFileSystem(uri);
    }

    async delete(uri: vscode.Uri, options: { readonly recursive: boolean; }): Promise<void> {
        await this.setupFileSystem(uri);

        const connection = await this.getConnection();
        if (connection === undefined) {
            throw Error('Connection to SFTP server lost.');
        }

        const { recursive } = options;
        const realPath = this.resolveRealPath(uri);
        const stat = await this.stat(uri);

        if (stat.type === vscode.FileType.Directory) {
            logger.appendLineToMessages('[delete] Delete folder: ' + realPath.path + ', recursive: ' + recursive);

            if (recursive) {
                const name = realPath.path.split('/').pop();
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Deleting folder "' + name + '"...',
                    cancellable: true
                }, async (progress, token) => {
                    await this.deleteDirectory(uri, recursive, connection.sftp!, token);
                });
                vscode.window.showInformationMessage('Folder "' + name + '" removed.');
            } else {
                await this.deleteDirectory(uri, recursive, connection.sftp!, undefined);
            }
        } else {
            logger.appendLineToMessages('[delete] Delete file: ' + realPath.path);
            await this.deleteFile(uri, connection.sftp!, undefined);
        }
    }

    private deleteFile(uri: vscode.Uri, client: SFTPWrapper, token: vscode.CancellationToken | undefined) {
        const realPath = this.resolveRealPath(uri);
        return new Promise<void>((resolve, reject) => {
            if (token?.isCancellationRequested) {
                reject(Error('Deleting task cancelled by user.'));
                return;
            }
            console.info('Deleting remote file ' + realPath.path);
            /*
            client.unlink(realPath.path, err => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });*/
            resolve();
        });
    }

    private deleteDirectory(uri: vscode.Uri, recursive: boolean, client: SFTPWrapper, token: vscode.CancellationToken | undefined) {
        const realPath = this.resolveRealPath(uri);
        return new Promise<void>((resolve, reject) => {
            if (token?.isCancellationRequested) {
                reject(Error('Deleting task cancelled by user.'));
                return;
            }

            if (!recursive) {
                console.info('Deleting remote folder ' + realPath.path);
                /*client.rmdir(realPath.path, err => {
                if (err) {
                    return reject(err);
                }

                resolve();
                });*/
                resolve();
                return;
            }
        
            this.readDirectory(uri).then(
                async (fileEntries) => {
                    try {
                        for (const entry of fileEntries) {
                            const filename = entry[0];
                            const fileType = entry[1];
                            const childUri = realPath.with({ path: upath.join(uri.path, filename) });
                            if (fileType === vscode.FileType.Directory) {
                                await this.deleteDirectory(childUri, true, client, token);
                            } else {
                                await this.deleteFile(childUri, client, token);
                            }
                        }
        
                        await this.deleteDirectory(uri, false, client, token);
                        resolve();
                    } catch(ex: any) {
                        reject(ex);
                    }
                },
                err => {
                reject(err);
                }
            );
        });
    }

    async rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { readonly overwrite: boolean; }): Promise<void> {
        await this.setupFileSystem(oldUri);
    }

    resolveRealPath(uri: vscode.Uri): vscode.Uri {
        if (uri.path.startsWith('/' + this.workDirName)) {
            var resPath = uri.path.replace('/' + this.workDirName, '');
            if (resPath.startsWith('/')) {
                resPath = resPath.replace('/', '');
            }
            return vscode.Uri.parse('sftp://' + uri.authority + '/' + resPath);
        }

        return uri;
    }

    getFileTypeByStats(stats: Stats) {
        return stats.isFile() ? vscode.FileType.File : (stats.isDirectory() ? vscode.FileType.Directory : (stats.isSymbolicLink() ? vscode.FileType.SymbolicLink : vscode.FileType.Unknown));
    }

    followSymbolicLinkAndGetStats(sftp: SFTPWrapper, realUri: vscode.Uri): Promise<Stats> {
        return new Promise(async (resolve, reject) => {
            sftp.realpath(realUri.path, (err, resolvedPath) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                sftp.lstat(resolvedPath, (err, resolvedStats) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(resolvedStats);
                });
            });
        });
    }

    async followSymbolicLinkAndGetRealPath(realUri: vscode.Uri): Promise<vscode.Uri> {
        const connection = await this.getConnection();

        if (connection === undefined) {
            logger.appendLineToMessages('Error when stat file (' + this.remoteName + '): Connection lost.');
            vscode.window.showErrorMessage('Broken connection to SFTP server.');
            throw (Error('Broken connection to SFTP server.'));
        }

        return await this.asyncfollowSymbolicLinkAndGetRealPath(connection.sftp!, realUri);
    }

    asyncfollowSymbolicLinkAndGetRealPath(sftp: SFTPWrapper, realUri: vscode.Uri): Promise<vscode.Uri> {
        return new Promise(async (resolve, reject) => {
            sftp.realpath(realUri.path, (err, resolvedPath) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                resolve(realUri.with({ path: resolvedPath }));
            });
        });
    }

    getFilename(uri: vscode.Uri): string {
        return upath.basename(uri.fsPath); // Extracts the filename from the file path
    }

    getDirectoryPath(uri: vscode.Uri): vscode.Uri {
        // Use path.dirname to get the directory path and convert it back to a vscode.Uri
        const directoryPath = upath.dirname(uri.fsPath);
        return vscode.Uri.file(directoryPath); // Return as a vscode.Uri
    }

    async statLocalFileByUri(uri: vscode.Uri): Promise<vscode.FileStat | undefined> {
        try {
          return await vscode.workspace.fs.stat(uri); // File exists
        } catch (error) {
          if ((error as vscode.FileSystemError).code === 'FileNotFound') {
            return undefined; // File does not exist
          }
          throw error; // Re-throw any other errors
        }
    }

    async resolveWhatFileIsNewer(localStats: vscode.FileStat, remoteStats: Stats): Promise<'same' | 'local_newer' | 'remote_newer' | 'same_mtime_different_size'> {
        try {
          // Get local file metadata
          const localModifiedTime = localStats.mtime; // Modification time in milliseconds
          const localSize = localStats.size;
      
          // Get remote file metadata
          const remoteModifiedTime = remoteStats.mtime * 1000; // Convert seconds to milliseconds
          const remoteSize = remoteStats.size;
      
          // Compare size and modification time
          if (localSize === remoteSize && localModifiedTime === remoteModifiedTime) {
            return 'same'; // Files are identical
          } else if (localModifiedTime > remoteModifiedTime) {
            return 'local_newer'; // Local file is newer
          } else if (localModifiedTime < remoteModifiedTime) {
            return 'remote_newer'; // Remote file is newer
          } else {
            return 'same_mtime_different_size'; // Files are different in some other way (e.g., size)
          }
        } catch (error: any) {
          throw new Error(`Error comparing files: ${error.message}`);
        }
    }

    async openLocalFolderInExplorer(uri: vscode.Uri) {
        const folderPath = uri.fsPath;
      
        if (!folderPath) {
          vscode.window.showErrorMessage("Invalid folder path.");
          return;
        }

        try {
          if (process.platform === 'win32') {
            // Windows
            childProcess.exec(`explorer "${folderPath}"`);
          } else if (process.platform === 'darwin') {
            // macOS
            childProcess.exec(`open "${folderPath}"`);
          } else {
            // Linux
            childProcess.exec(`xdg-open "${folderPath}"`);
          }
        } catch (error: any) {
          vscode.window.showErrorMessage(`Failed to open folder: ${error.message}`);
        }
    }

    async downloadRemoteToLocalIfNeeded(uri: vscode.Uri, readFile: boolean): Promise<Uint8Array | undefined> {
        return new Promise(async (resolve, reject) => {
            const realUri = this.resolveRealPath(uri);
            logger.appendLineToMessages('[read-file] ' + realUri.path);

            const connection = await this.getConnection();
            if (connection === undefined) {
                reject(Error('Broken connection to SFTP server.'));
                return;
            }

            connection.sftp!.lstat(realUri.path, async(error, remoteStat) => {
                if (error) {
                    reject(error);
                    return;
                }

                try {
                    const fileType = this.getFileTypeByStats(remoteStat);

                    var realStats = remoteStat;
                    if (fileType === vscode.FileType.SymbolicLink) {
                        realStats = await this.followSymbolicLinkAndGetStats(connection.sftp!, realUri);
                    }
                    const fileSize = realStats.size;

                    // check if exists in local
                    const calculatedLocalFile = this.workDirPath.with({ path: upath.join(this.workDirPath.fsPath, realUri.path) });
                    const localFileStat = await this.statLocalFileByUri(calculatedLocalFile);

                    if (localFileStat !== undefined) {
                        const comparisionResult = await this.resolveWhatFileIsNewer(localFileStat, remoteStat);
                        if (comparisionResult === 'same') {
                            logger.appendLineToMessages('[read-file] ' + realUri.path + ' -> Local file exists and is the same as remote, using local file., rmtime: ' + (remoteStat.mtime * 1000) + ', ltime: ' + localFileStat.mtime);
                            
                            if (!readFile) {
                                resolve(undefined);
                                return;
                            }

                            const res = await vscode.workspace.fs.readFile(calculatedLocalFile);
                            resolve(res);

                            fileDecorationManager.setUpToDateFileDecoration(uri);

                            return;
                        } else if(comparisionResult === 'local_newer') {
                            logger.appendLineToMessages('[read-file] ' + realUri.path + ' -> Local file exists and is newer than remote, rmtime: ' + (remoteStat.mtime * 1000) + ', ltime: ' + localFileStat.mtime);
                            
                            if (!readFile) {
                                resolve(undefined);
                                return;
                            }
                            
                            const res = await vscode.workspace.fs.readFile(calculatedLocalFile);
                            resolve(res);

                            fileDecorationManager.setUpToDateFileDecoration(uri);

                            return;
                        } else if(comparisionResult === 'remote_newer') {
                            fileDecorationManager.setRemoteDownloadFileDecoration(uri);
                            logger.appendLineToMessages('[read-file] ' + realUri.path + ' -> Remote is newer than local file, download needed, rmtime: ' + (remoteStat.mtime * 1000) + ', ltime: ' + localFileStat.mtime);
                        } else if(comparisionResult === 'same_mtime_different_size') {
                            // TODO: how handle this conflict?
                            fileDecorationManager.setUnknownStateFileDecoration(uri);
                            logger.appendLineToMessages('[read-file] ' + realUri.path + ' -> Remote and local have same mtime, but different sizes, download needed., rmtime: ' + (remoteStat.mtime * 1000) + ', ltime: ' + localFileStat.mtime);
                        }
                    }

                    // TODO: Configuration, if more than 30mb ask to user for download
                    if (fileSize > (1024) * (1024) * 30) {
                        const totalMB = fileSize / (1024 * 1024);
                        const answer = await vscode.window.showInformationMessage(
                            'This file has a size of ' + totalMB.toFixed(2) + 'MB , continue downloading it? Large files may took more time to download and this process is not cancellable.',
                            { modal: true },
                            'Continue'
                        );

                        if (answer !== 'Continue') {
                            reject(new Error('File read operation canceled by user.'));
                            return;
                        }
                    }

                    const filename = this.getFilename(realUri);
                    const res = await vscode.window.withProgress({
                        cancellable: false,
                        location: vscode.ProgressLocation.Notification,
                        title: 'Downloading ' + filename + '...'
                    }, (progress) => {
                        return new Promise<Uint8Array| undefined>(async (resolveProgress, rejectProgress) => {
                            // Read file fast...
                            // TODO: Configuration
                            logger.appendLineToMessages('[download-file ' + filename + '] [fast-get] remote: ' + realUri.path + ', local: ' + calculatedLocalFile.fsPath);

                            // Try to create directory if not exists
                            vscode.workspace.fs.createDirectory(this.getDirectoryPath(calculatedLocalFile));

                            connection.sftp!.fastGet(
                                realUri.path, 
                                calculatedLocalFile.fsPath, 
                                {
                                    fileSize: remoteStat.size,
                                    step(total, nb, fsize) {
                                        logger.appendLineToMessages('[download-file ' + filename + '] Progress "' + total + '" of "' + fsize + '" transferred.');
                                        progress.report({ increment: (nb / fsize) * 100 }); 
                                    }
                                }, 
                                async (err) => {
                                    if (err) {
                                        rejectProgress(err);
                                        return;
                                    }

                                    // read local file
                                    if (readFile) {
                                        try {
                                            const data = await vscode.workspace.fs.readFile(calculatedLocalFile);
                                            resolveProgress(data);
                                        } catch(ex: any) {
                                            logger.appendLineToMessages('Cannot read file (' + this.remoteName + '): ' + ex.message);
                                            vscode.window.showErrorMessage(ex.message);
                                            rejectProgress(err);
                                        }
                                    } else {
                                        resolveProgress(undefined);
                                    }
                                }
                            );
                        });
                    });

                    fileDecorationManager.setUpToDateFileDecoration(uri);
                    vscode.window.setStatusBarMessage(filename + ' downloaded successfully!', 10000);
                    resolve(res);
                } catch(ex: any) {
                    logger.appendLineToMessages('Cannot read file (' + this.remoteName + '): ' + ex.message);
                    vscode.window.showErrorMessage(ex.message);
                    reject(ex);
                }
            });
        });
    }

    dispose() {
        console.log('Removing file watcher...');
        this.workdDirWatcher.dispose();
    }
}

export enum ErrorCodes {
    FILE_NOT_FOUND = 2,
    PERMISSION_DENIED = 3,
    FILE_EXISTS = 4,
}

export class FileSystemErrorBuilder {
    static FileNotFound(uri: vscode.Uri) {
        return vscode.FileSystemError.FileNotFound(`${uri.path} not found`);
    }

    static NoPermissions(uri: vscode.Uri) {
        return vscode.FileSystemError.NoPermissions(`${uri.path} no permissions`);
    }

    static FileExists(uri: vscode.Uri) {
        return vscode.FileSystemError.FileExists(`${uri.path} already exists`);
    }
}
