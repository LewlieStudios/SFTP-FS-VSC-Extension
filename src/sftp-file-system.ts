import * as vscode from 'vscode';
import logger from './logger';
import configuration, { RemoteConfiguration } from './configuration';
import connectionManager, { ConnectionProvider, PoolType } from './connection-manager';
import { SFTPWrapper, Stats } from 'ssh2';
import upath from 'upath';
import * as childProcess from 'child_process';
import fileDecorationManager from './file-decoration-manager';
import fs from 'fs';
import { randomUUID, UUID } from 'crypto';

export class SFTPFileSystemProvider implements vscode.FileSystemProvider {
    static sftpFileProvidersByRemotes = new Map<string, SFTPFileSystemProvider>();

	private _bufferedEvents: vscode.FileChangeEvent[] = [];
	private _fireSoonHandle?: NodeJS.Timeout;
    private readonly _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

    private _watchLocks: Map<UUID, WatchLock> = new Map();

    remoteName!: string;
    remoteConfiguration!: RemoteConfiguration;
    workDirPath!: vscode.Uri;
    //workDirName!: string;
    workDirWatcher!: vscode.FileSystemWatcher;
    setupDone = false;
    isVCFocused = false;
    watchLocksCleanupTask!: NodeJS.Timeout;

    private async setupFileSystem(uri: vscode.Uri) {
        if (this.setupDone) {
            return;
        }

        this.setupDone = true;

        this.watchLocksCleanupTask = setInterval(() => {
            // prune old locks
            this.pruneExpiredLocks();
        }, 1000);

        SFTPFileSystemProvider.sftpFileProvidersByRemotes.set(uri.authority, this);
        this.remoteName = uri.authority;
        this.remoteConfiguration = await configuration.getRemoteConfiguration(this.remoteName) ?? {};
        const current = (await configuration.getWorkDirForRemote(this.remoteName));
        if (current === undefined) {
            throw Error("Working directory not found for this SFTP file provider.");
        }
        this.workDirPath = vscode.Uri.file(current);
        //this.workDirName = current.split('/').pop()!;

        if(!connectionManager.poolExists(this.remoteName)) {
            console.log('Creating connections pool!');
            connectionManager.createPool({
                configuration: this.remoteConfiguration,
                remoteName: this.remoteName
            });
        }

        this.isVCFocused = vscode.window.state.focused;
        vscode.window.onDidChangeWindowState((state) => {
            this.isVCFocused = state.focused;
        });

        console.log('Creating file watcher...');
        this.workDirWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(this.workDirPath, '**/*')
        );

        this.workDirWatcher.onDidCreate(async (uri) => {
            if (true) {
                // Disabled for now, rework required.
                return;
            }

            /*
            if (this.isWatchLocked(uri) || this.isVCFocused) {
                return;
            }

            const localStat = await vscode.workspace.fs.stat(uri);

            if (localStat.type === vscode.FileType.File) {
                const relativePath = uri.path.replace(this.workDirPath.path, '');
                const remotePath = vscode.Uri.parse('sftp://' + this.remoteName + '/' + this.workDirName + '' + relativePath);
                console.log('[watcher-changes] File created outside VC: ' + uri.path + ', RelativePath: ' + relativePath);
                console.log('[watcher-changes] Uploading to: ' + remotePath);

                const content = await vscode.workspace.fs.readFile(uri);
                await this.writeFile(remotePath, content, { create: true, overwrite: true });
                this._fireSoon({ type: vscode.FileChangeType.Created, uri: remotePath });
            } else if(localStat.type === vscode.FileType.Directory) {
                const relativePath = uri.path.replace(this.workDirPath.path, '');
                const remotePath = vscode.Uri.parse('sftp://' + this.remoteName + '/' + this.workDirName + '' + relativePath);
                console.log('[watcher-changes] Folder created outside VC: ' + uri.path + ', RelativePath: ' + relativePath);
                console.log('[watcher-changes] Creating folder to: ' + remotePath);
                await this.createDirectory(remotePath);
                this._fireSoon({ type: vscode.FileChangeType.Created, uri: remotePath });
            }
            */
        });

        this.workDirWatcher.onDidDelete(async (uri) => {
            if (true) {
                // Disabled for now, rework required.
                return;
            }

            /*
            if (this.isWatchLocked(uri) || this.isVCFocused) {
                return;
            }

            const relativePath = uri.path.replace(this.workDirPath.path, '');
            const remotePath = vscode.Uri.parse('sftp://' + this.remoteName + '/' + this.workDirName + '' + relativePath);
            console.log('[watcher-changes] File deleted outside VC: ' + uri.path + ', RelativePath: ' + relativePath);
            console.log('[watcher-changes] Deleting from: ' + remotePath);

            await this.delete(remotePath, { recursive: true });
            this._fireSoon({ type: vscode.FileChangeType.Deleted, uri: remotePath });
            */
        });

        this.workDirWatcher.onDidChange(async (uri) => {
            if (true) {
                // Disabled for now, rework required.
                return;
            }

            /*
            if (this.isWatchLocked(uri) || this.isVCFocused) {
                return;
            }
            const localStat = await vscode.workspace.fs.stat(uri);

            if (localStat.type === vscode.FileType.File) {
                const relativePath = uri.path.replace(this.workDirPath.path, '');
                const remotePath = vscode.Uri.parse('sftp://' + this.remoteName + '/' + this.workDirName + '' + relativePath);
                console.log('[watcher-changes] File updated outside VC: ' + uri.path + ', RelativePath: ' + relativePath);
                console.log('[watcher-changes] Uploading to: ' + remotePath);

                const lock = this.addWatchLockFromLocalUri(uri);
                try {
                    const content = await vscode.workspace.fs.readFile(uri);
                    await this.writeFile(remotePath, content, { create: true, overwrite: true });
                    this._fireSoon({ type: vscode.FileChangeType.Changed, uri: remotePath });
                } finally {
                    setTimeout(() => {
                        this.removeWatchLock(lock);
                    }, 1500);
                }
            }
            */
        });
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

            if (uri.path.startsWith('/.vscode')) {
                logger.appendLineToMessages('[stat] Skipped stat: ' + uri.path);
                reject(vscode.FileSystemError.FileNotFound(uri));
                return;
            }

            if (uri.path.startsWith('/.git')) {
                logger.appendLineToMessages('[stat] Skipped stat: ' + uri.path);
                reject(vscode.FileSystemError.FileNotFound(uri));
                return;
            }

            try {
                await this.setupFileSystem(uri);
                const connectionProvider = await this.getConnection('passive');
                const connection = connectionProvider?.getSFTP();

                if (connection === undefined) {
                    logger.appendLineToMessages('Error when stat file (' + this.remoteName + '): Connection lost.');
                    vscode.window.showErrorMessage('Broken connection to SFTP server.');
                    return;
                }

                try {
                    logger.appendLineToMessages('[stat] ' + uri.path);
                    connection!.lstat(uri.path, async (err: any, stats) => {
                        if (err) {
                            await this.releaseConnection(connectionProvider);

                            if (err.code === ErrorCodes.FILE_NOT_FOUND) {
                                logger.appendLineToMessages('File not found when stat file (' + this.remoteName + '): ' + uri.path);
                                reject(vscode.FileSystemError.FileNotFound(uri));
                                return;
                            }

                            reject(err);
                            return;
                        }

                        try {
                            var fileStats = stats;
                            var fileType = this.getFileTypeByStats(fileStats);

                            if (fileType === vscode.FileType.SymbolicLink) {
                                fileStats = await this.followSymbolicLinkAndGetStats(connection, uri);
                                fileType = this.getFileTypeByStats(fileStats);
                            }

                            // Check local file
                            var calculatedLocalFile = this.getLocalFileUri(uri);
                            const lock = this.addWatchLockFromLocalUri(calculatedLocalFile);
                            try {
                                const localFileStat = await this.statLocalFileByUri(calculatedLocalFile);
                                if (localFileStat === undefined) {
                                    fileDecorationManager.setRemoteFileDecoration(uri);
                                } else {
                                    if (localFileStat.type === vscode.FileType.Directory) {
                                        fileDecorationManager.setDirectoryFileDecoration(uri);
                                    } else {
                                        const res = await this.resolveWhatFileIsNewer(localFileStat, fileStats);
                                        if (res === 'local_newer' || res === "same") {
                                            fileDecorationManager.setUpToDateFileDecoration(uri);
                                        } else if(res === 'remote_newer') {
                                            fileDecorationManager.setRemoteDownloadFileDecoration(uri);
                                        } else {
                                            fileDecorationManager.setUnknownStateFileDecoration(uri);
                                        }
                                    }
                                }
                            } finally {
                                this.removeWatchLock(lock);
                            }

                            await this.releaseConnection(connectionProvider);
                            resolve({
                                type: fileType,
                                ctime: 0,
                                mtime: fileStats.mtime,
                                size: fileStats.size
                            });
                        } catch(ex: any) {
                            await this.releaseConnection(connectionProvider);
                            reject(ex);
                        }
                    });
                } catch(error: any) {
                    await this.releaseConnection(connectionProvider);
                    if (error.code === ErrorCodes.FILE_NOT_FOUND) {
                        logger.appendErrorToMessages('File not found when stat file (' + this.remoteName + '): ' + uri.path, error);
                        reject(vscode.FileSystemError.FileNotFound(uri));
                    } else {
                        logger.appendErrorToMessages('Error when stat file (' + this.remoteName + '): ' + uri.path, error);
                        vscode.window.showErrorMessage(error.message);
                        reject(error);
                    }
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

                if (uri.path.startsWith('/.vscode')) {
                    resolve(
                        []
                    );
                    return;
                }

                if (uri.path.startsWith('/.git')) {
                    resolve(
                        []
                    );
                    return;
                }

                logger.appendLineToMessages('[read-dir] ' + uri.path);

                const connectionProvider = await this.getConnection('passive');
                const connection = connectionProvider?.getSFTP();
                if (connection === undefined) {
                    throw Error('Broken connection to SFTP server.');
                }

                connection.readdir(uri.path, async (err, stats) => {
                    if(err) {
                        await this.releaseConnection(connectionProvider);
                        reject(err);
                        return;
                    }

                    try {
                        const result: [string, vscode.FileType][] = [];

                        for (const entry of stats) {
                            var entryStats = entry.attrs;
                            var fileType = this.getFileTypeByStats(entryStats);

                            if (fileType === vscode.FileType.SymbolicLink) {
                                entryStats = await this.followSymbolicLinkAndGetStats(connection, uri.with({ path: upath.join(uri.path, entry.filename) }));
                                fileType = this.getFileTypeByStats(entryStats);
                            }

                            result.push([entry.filename, fileType]);

                            // Determine if there is a local version of this file.
                            var calculatedLocalFile = this.workDirPath.with({ path: upath.join(this.workDirPath.fsPath, upath.join(uri.path, entry.filename)) });
                            const localFileStat = await this.statLocalFileByUri(calculatedLocalFile);
                            if (localFileStat === undefined) {
                                fileDecorationManager.setRemoteFileDecoration(uri.with({ path: upath.join(uri.path, entry.filename) }));
                            } else {
                                if (localFileStat.type === vscode.FileType.Directory) {
                                    fileDecorationManager.setDirectoryFileDecoration(uri.with({ path: upath.join(uri.path, entry.filename) }));
                                } else {
                                    const res = await this.resolveWhatFileIsNewer(localFileStat, entryStats);
                                    if (res === 'local_newer' || res === "same") {
                                        fileDecorationManager.setUpToDateFileDecoration(uri.with({ path: upath.join(uri.path, entry.filename) }));
                                    } else if(res === 'remote_newer') {
                                        fileDecorationManager.setRemoteDownloadFileDecoration(uri.with({ path: upath.join(uri.path, entry.filename) }));
                                    } else {
                                        fileDecorationManager.setUnknownStateFileDecoration(uri.with({ path: upath.join(uri.path, entry.filename) }));
                                    }
                                }
                            }
                        }

                        await this.releaseConnection(connectionProvider);
                        resolve(result);
                    } catch(ex: any) {
                        await this.releaseConnection(connectionProvider);
                        reject(ex);
                    }
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

                if (uri.path.startsWith('/.vscode')) {
                    resolve(new Uint8Array());
                    return;
                }

                if (uri.path.startsWith('/.git')) {
                    resolve(new Uint8Array());
                    return;
                }

                const data = await this.downloadRemoteFileToLocalIfNeeded(uri, true, 'passive');
                resolve(data!);
            } catch(ex: any) {
                logger.appendLineToMessages('Cannot read file (' + this.remoteName + '): ' + ex.message);
                vscode.window.showErrorMessage(ex.message);
                reject(ex);
            }
        });
    }

    writeFile(uri: vscode.Uri, content: Uint8Array, options: { readonly create: boolean; readonly overwrite: boolean; }): Promise<void> {
        return new Promise( async (resolve, reject) => {
            await this.setupFileSystem(uri);
            const connectionProvider = await this.getConnection('passive');
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                reject(Error('[write-file] SFTP connection lost'));
                return;
            }

            // First, try to know if the file exists at server side.
            const localPath = this.getLocalFileUri(uri);
            const lock = this.addWatchLockFromLocalUri(localPath);

            // Prevent expiration, because all operations involved in this logic can took long time to complete...
            lock.preventExpire = true;

            connection.lstat(uri.path, async (err: any, stats) => {
                try {
                    if (err) {
                        if (err.code === ErrorCodes.FILE_NOT_FOUND) {
                            // File not found and we will not try to create the file.
                            if (!options.create) {
                                this.releaseConnection(connectionProvider);
                                this.removeWatchLock(lock);
                                reject(vscode.FileSystemError.FileNotFound(uri));
                                return;
                            }
                        } else {
                            this.releaseConnection(connectionProvider);
                            this.removeWatchLock(lock);
                            reject(err);
                            return;
                        }
                    } else {
                        // If file exists, and we will no try to overwrite
                        if(!options.overwrite) {
                            this.releaseConnection(connectionProvider);
                            this.removeWatchLock(lock);
                            reject(vscode.FileSystemError.FileExists(uri));
                            return;
                        }

                        // We will not try to write in symbolic links...
                        if(stats.isSymbolicLink()) {
                            this.releaseConnection(connectionProvider);
                            this.removeWatchLock(lock);
                            reject(Error('Cannot write content, remote file is a symbolic link.'));
                            return;
                        }

                        // We will not try to write in directories...
                        if(!stats.isFile()) {
                            this.releaseConnection(connectionProvider);
                            this.removeWatchLock(lock);
                            reject(Error('Cannot write content, remote file is a directory.'));
                            return;
                        }
                    }

                    // Continue normally...
                    // First, write content to local file.
                    var statLocal = await this.statLocalFileByUri(localPath);

                    if (statLocal !== undefined && statLocal.type !== vscode.FileType.File) {
                        this.releaseConnection(connectionProvider);
                        this.removeWatchLock(lock);
                        logger.appendLineToMessages('[write-file] Local file exists but is not a File: ' + localPath.fsPath);
                        reject(Error('Local file expected to be a file, but it was a directory, file location: ' + localPath.fsPath));
                        return;
                    }

                    // Check if parent directory exists, if not, make it.
                    const parentDirectory = this.getDirectoryPath(localPath);

                    const lock2 = this.addWatchLockFromLocalUri(parentDirectory);
                    try {
                        const parentDirectoryStat = this.statLocalFileByUri(parentDirectory);
                        if (parentDirectoryStat === undefined) {
                            await vscode.workspace.fs.createDirectory(parentDirectory);
                            logger.appendLineToMessages('[write-file] Created local dir ' + parentDirectory.fsPath);
                        }
                    } catch(ex: any) {
                        this.releaseConnection(connectionProvider);
                        logger.appendErrorToMessages('[write-file] Failed to create local dir ' + parentDirectory.fsPath + ': ', ex);
                        reject(ex);
                        return;
                    } finally {
                        this.removeWatchLock(lock);
                        this.removeWatchLock(lock2);
                    }

                    // Write content to local file.
                    await vscode.workspace.fs.writeFile(localPath, content);
                    logger.appendLineToMessages('[write-file] Local file updated with content, uploading file to remote..., targetPath:' + uri.path + ', localFile: ' + localPath.fsPath);

                    statLocal = await this.statLocalFileByUri(localPath);
                    const filename = this.getFilename(uri);

                    // upload file to remote
                    await vscode.window.withProgress({
                        cancellable: false,
                        location: vscode.ProgressLocation.Notification,
                        title: 'Uploading ' + filename + '...'
                    }, (progress) => {
                        return new Promise<void>(async (resolveProgress, rejectProgress) => {
                            connection.fastPut(
                                localPath.fsPath, 
                                uri.path,
                                {
                                    fileSize: statLocal!.size,
                                    step(total, nb, fileSize) {
                                        logger.appendLineToMessages('[upload-file ' + filename + '] Progress "' + total + '" of "' + fileSize + '" transferred.');
                                        progress.report({ increment: (nb / fileSize) * 100 }); 
                                    },
                                },
                                async (err) => {
                                    if (err) {
                                        rejectProgress(err);
                                        return;
                                    }

                                    resolveProgress();
                                }
                            );
                        });
                    });

                    logger.appendLineToMessages('[write-file] Write completed, mtime must be updated for: ' + uri.path);
                    connection.lstat(uri.path, async (err: any, stats) => {
                        if (err) {
                            // No error expected at this point, but since we only need stats at this point to adjust the mtime of local file
                            // then we will simply discard this error and print in the logs.
                            logger.appendErrorToMessages('[write-file] Something went wrong while updating mtime of local file: ', err);
                            this.releaseConnection(connectionProvider);
                            this.removeWatchLock(lock);
                            this.removeWatchLock(lock2);
                            this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
                            resolve();
                            return;
                        }

                        try {
                            this.addWatchLockFromLocalUri(localPath);
                            fs.utimes(localPath.fsPath, stats.atime, stats.mtime, (err) => {
                                if (err) {
                                    // This error is not really important, so instead of fail the entire process only print this in the logs...
                                    logger.appendErrorToMessages('[write-file] Something went wrong while updating mtime of local file: ', err);
                                }

                                this.releaseConnection(connectionProvider);
                                this.removeWatchLock(lock);
                                this.removeWatchLock(lock2);
                                this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
                                resolve();
                            });
                        } catch(ex: any) {
                            this.releaseConnection(connectionProvider);
                            this.removeWatchLock(lock);
                            this.removeWatchLock(lock2);
                            logger.appendErrorToMessages('[write-file] Something went wrong: ', ex);
                            reject(ex);
                        }
                    });
                } catch(ex: any) {
                    this.releaseConnection(connectionProvider);
                    this.removeWatchLock(lock);
                    logger.appendErrorToMessages('[write-file] Something went wrong: ', ex);
                    reject(ex);
                }
            });
        });
    }

    async createDirectory(uri: vscode.Uri): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            cancellable: false,
            title: 'Creating directory "' + uri.path + ' "...'
        }, () => {
            return new Promise<void>(async (resolve, reject) => {
                await this.setupFileSystem(uri);
                const connectionProvider = await this.getConnection('passive');
                const connection = connectionProvider?.getSFTP();
                if (connection === undefined) {
                    reject(Error('Connection to SFTP lost.'));
                    return;
                }
    
                logger.appendLineToMessages('[create dir] ' + uri.path);
                connection.mkdir(uri.path, async (err) => {
                  if (err) {
                    this.releaseConnection(connectionProvider);
                    return reject(err);
                  }
                  this.releaseConnection(connectionProvider);
    
                  // Create local directory
                  const localPath = this.getLocalFileUri(uri);
    
                  const lock = this.addWatchLockFromLocalUri(localPath);
                  try {
                    logger.appendLineToMessages('[create local dir] ' + localPath.fsPath);
                    await vscode.workspace.fs.createDirectory(localPath);
                  } catch(ex: any) {
                    logger.appendErrorToMessages('[create local dir] Failed to create: ', ex);
                  } finally {
                    this.removeWatchLock(lock);
                  }
    
                  const dirname = uri.with({ path: upath.dirname(uri.path) });
                  this._fireSoon({ type: vscode.FileChangeType.Changed, uri: dirname }, { type: vscode.FileChangeType.Created, uri });
                  resolve();
                });
            });
        });
    }

    async delete(uri: vscode.Uri, options: { readonly recursive: boolean; }): Promise<void> {
        await this.setupFileSystem(uri);

        const connectionProvider = await this.getConnection('heavy');
        const connection = connectionProvider?.getSFTP();
        if (connection === undefined) {
            throw Error('Connection to SFTP server lost.');
        }

        try {
            const { recursive } = options;
            const stat = await this.stat(uri);

            if (stat.type === vscode.FileType.Directory) {
                logger.appendLineToMessages('[delete] Delete folder: ' + uri.path + ', recursive: ' + recursive);

                if (recursive) {
                    const name = uri.path.split('/').pop();
                    await vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: 'Deleting folder "' + name + '"...',
                        cancellable: true
                    }, async (progress, token) => {
                        await this.deleteDirectory(uri, recursive, connection, token);
                    });
                } else {
                    await this.deleteDirectory(uri, recursive, connection, undefined);
                }
            } else {
                logger.appendLineToMessages('[delete] Delete file: ' + uri.path);
                await this.deleteFile(uri, connection, undefined);
            }

            const dirname = uri.with({ path: upath.dirname(uri.path) });
            this._fireSoon(
                { type: vscode.FileChangeType.Changed, uri: dirname },
                { uri, type: vscode.FileChangeType.Deleted }
            );

            await this.releaseConnection(connectionProvider);
        } catch(ex: any) {
            await this.releaseConnection(connectionProvider);
            throw ex;
        }
    }

    private deleteFile(uri: vscode.Uri, client: SFTPWrapper, token: vscode.CancellationToken | undefined) {
        return new Promise<void>((resolve, reject) => {
            if (token?.isCancellationRequested) {
                reject(Error('Deleting task cancelled by user.'));
                return;
            }
            logger.appendLineToMessages('Deleting remote file ' + uri.path);
            vscode.window.setStatusBarMessage('Deleting ' + uri.path + '...', 1000);
            client.unlink(uri.path, async (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Delete local file...
                const localPath = this.getLocalFileUri(uri);
                const lock = this.addWatchLockFromLocalUri(localPath);
                try {
                    await vscode.workspace.fs.delete(localPath, { recursive: true, useTrash: false });
                } catch(ex: any) {
                    logger.appendErrorToMessages('Failed to delete local folder: ', ex);
                } finally {
                    this.removeWatchLock(lock);
                }

                resolve();
            });
        });
    }

    private deleteDirectory(uri: vscode.Uri, recursive: boolean, client: SFTPWrapper, token: vscode.CancellationToken | undefined) {
        return new Promise<void>((resolve, reject) => {
            if (token?.isCancellationRequested) {
                reject(Error('Deleting task cancelled by user.'));
                return;
            }

            if (!recursive) {
                logger.appendLineToMessages('Deleting remote folder ' + uri.path);
                vscode.window.setStatusBarMessage('Deleting ' + uri.path + '...', 1000);
                client.rmdir(uri.path, async (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Delete local directory...
                    const localPath = this.getLocalFileUri(uri);
                    const lock = this.addWatchLockFromLocalUri(localPath);
                    try {
                        await vscode.workspace.fs.delete(localPath, { recursive: true, useTrash: false });
                    } catch(ex: any) {
                        logger.appendErrorToMessages('Failed to delete local folder: ', ex);
                    } finally {
                        this.removeWatchLock(lock);
                    }

                    resolve();
                });
                return;
            }
        
            this.readDirectory(uri).then(
                async (fileEntries) => {
                    try {
                        const promises = fileEntries.map(async (entry) => {
                            const filename = entry[0];
                            const fileType = entry[1];
                            const childUri = uri.with({ path: upath.join(uri.path, filename) });
                            if (fileType === vscode.FileType.Directory) {
                                await this.deleteDirectory(childUri, true, client, token);
                            } else {
                                await this.deleteFile(childUri, client, token);
                            }
                        });

                        await Promise.all(promises);
                        await this.deleteDirectory(uri, false, client, token);
                        resolve();
                    } catch(ex: any) {
                        reject(ex);
                    }
                },
                err => {
                reject(err);
                }
            ).catch((ex) => {
                reject(ex);
            });
        });
    }

    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { readonly overwrite: boolean; }): Promise<void> {
        return new Promise(async (resolve, reject) => {
            await this.setupFileSystem(oldUri);
            const connectionProvider = await this.getConnection('passive');
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                reject(Error('Connection to SFTP server lost.'));
                return;
            }

            logger.appendLineToMessages('[rename] From ' + oldUri.path + ' to ' + newUri.path);
            connection.rename(oldUri.path, newUri.path, async (err) => {
                if (err) {
                    this.releaseConnection(connectionProvider);
                    reject(err);
                    return;
                }

                this.releaseConnection(connectionProvider);

                // Rename local file too...
                const oldLocalUri = this.getLocalFileUri(oldUri);
                const newLocalUri = this.getLocalFileUri(newUri);

                const lock1 = this.addWatchLockFromLocalUri(oldLocalUri);
                const lock2 = this.addWatchLockFromLocalUri(newLocalUri);
                try {
                    const oldStats = this.statLocalFileByUri(oldLocalUri);
                    if (oldStats !== undefined) {
                        logger.appendLineToMessages('[rename-local] From ' + oldLocalUri.fsPath + ' to ' + newLocalUri.fsPath);
                        await vscode.workspace.fs.rename(oldLocalUri, newLocalUri, { overwrite: true});
                    }
                } catch(ex: any) {
                    logger.appendErrorToMessages('[rename-local] Failed operation:', ex);
                } finally {
                    this.removeWatchLock(lock1);
                    this.removeWatchLock(lock2);
                }

                this._fireSoon(
                    { type: vscode.FileChangeType.Deleted, uri: oldUri },
                    { type: vscode.FileChangeType.Created, uri: newUri }
                );
                resolve();
            });
        });
    }

    getFileTypeByStats(stats: Stats) {
        return stats.isFile() ? vscode.FileType.File : (stats.isDirectory() ? vscode.FileType.Directory : (stats.isSymbolicLink() ? vscode.FileType.SymbolicLink : vscode.FileType.Unknown));
    }

    followSymbolicLinkAndGetStats(sftp: SFTPWrapper, uri: vscode.Uri): Promise<Stats> {
        return new Promise(async (resolve, reject) => {
            sftp.realpath(uri.path, (err, resolvedPath) => {
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

    async followSymbolicLinkAndGetRealPath(uri: vscode.Uri, connectionSFTP: SFTPWrapper | undefined = undefined): Promise<vscode.Uri> {
        var connection = connectionSFTP;
        var connectionProvider: ConnectionProvider | undefined = undefined;

        if (connection === undefined) {
            connectionProvider = await this.getConnection('heavy');
            connection = connectionProvider?.getSFTP();
        }

        if (connection === undefined) {
            logger.appendLineToMessages('Error when stat file (' + this.remoteName + '): Connection lost.');
            vscode.window.showErrorMessage('Broken connection to SFTP server.');
            throw (Error('Broken connection to SFTP server.'));
        }

        try {
            await this.releaseConnection(connectionProvider);
            return await this.asyncFollowSymbolicLinkAndGetRealPath(connection, uri);
        } catch(ex: any) {
            await this.releaseConnection(connectionProvider);
            throw ex;
        }
    }

    asyncFollowSymbolicLinkAndGetRealPath(sftp: SFTPWrapper, uri: vscode.Uri): Promise<vscode.Uri> {
        return new Promise(async (resolve, reject) => {
            sftp.realpath(uri.path, (err, resolvedPath) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                resolve(uri.with({ path: resolvedPath }));
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

    private downloadedCount = 0;
    private downloadCount = 0;
    private downloadedProgress = 0.0;

    private uploadedCount = 0;
    private uploadCount = 0;
    private uploadedProgress = 0.0;

    async uploadRemoteFolderFromLocal(uri: vscode.Uri, progress: vscode.Progress<{ message?: string; increment?: number; }>, token: vscode.CancellationToken): Promise<void> {
        return new Promise(async (resolve, reject) => {
            logger.appendLineToMessages('[read-file] ' + uri.path);

            const connectionProvider = await this.getConnection('heavy');
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                reject(Error('Broken connection to SFTP server.'));
                return;
            }

            connection.lstat(uri.path, async(error, remoteStat) => {
                await this.releaseConnection(connectionProvider);

                if (error) {
                    reject(error);
                    return;
                }

                if (!remoteStat.isDirectory()) {
                    reject(Error('Remote file is not a directory.'));
                    return;
                }

                // First, list all files.
                const localUri = this.getLocalFileUri(uri);
                const files = await this.listLocalFolder(localUri, token);

                if (files.length === 0) {
                    vscode.window.showInformationMessage('This folder is empty.');
                    resolve();
                    return;
                }

                const dialogRes = await vscode.window.showInformationMessage(
                    files.length + ' files will be uploaded, continue with the operation?',
                    {
                        modal: true
                    },
                    "Yes",
                    "No"
                );

                if (dialogRes === undefined || dialogRes === 'No') {
                    reject(Error('Operation cancelled by user.'));
                    return;
                }

                this.uploadedCount = 0;
                this.uploadCount = files.length;
                this.uploadedProgress = 100.0 / this.uploadCount;

                // Upload download process...
                try {
                    await this.uploadAllFiles(files, progress, token);
                    resolve();
                } catch(ex: any) {
                    reject(ex);
                }
            });
        });
    }

    async downloadRemoteFolderToLocal(uri: vscode.Uri, progress: vscode.Progress<{ message?: string; increment?: number; }>, token: vscode.CancellationToken): Promise<void> {
        return new Promise(async (resolve, reject) => {
            logger.appendLineToMessages('[read-file] ' + uri.path);

            const connectionProvider = await this.getConnection('heavy');
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                reject(Error('Broken connection to SFTP server.'));
                return;
            }

            connection.lstat(uri.path, async(error, remoteStat) => {
                await this.releaseConnection(connectionProvider);

                if (error) {
                    reject(error);
                    return;
                }

                if (!remoteStat.isDirectory()) {
                    reject(Error('Remote file is not a directory.'));
                    return;
                }

                // First, list all files.
                const files = await this.listRemoteFolder(uri, token);

                if (files.length === 0) {
                    vscode.window.showInformationMessage('This folder is empty.');
                    resolve();
                    return;
                }

                const dialogRes = await vscode.window.showInformationMessage(
                    files.length + ' files will be downloaded, continue with the operation?',
                    {
                        modal: true
                    },
                    "Yes",
                    "No"
                );

                if (dialogRes === undefined || dialogRes === 'No') {
                    reject(Error('Operation cancelled by user.'));
                    return;
                }

                this.downloadedCount = 0;
                this.downloadCount = files.length;
                this.downloadedProgress = 100.0 / this.downloadCount;

                // Start download process...
                try {
                    await this.downloadAllFiles(files, progress, token);
                    resolve();
                } catch(ex: any) {
                    reject(ex);
                }
            });
        });
    }

    private async listLocalFolder(uri: vscode.Uri,  token: vscode.CancellationToken): Promise<[vscode.Uri, vscode.FileType][]> {
        return new Promise(async (resolve, reject) => {
            if (token.isCancellationRequested) {
                reject(Error('Operation cancelled by user'));
                return;
            }
            
            // Uri for local folder
            logger.appendLineToMessages('[upload-from-local] Listing dir: ' + uri.path);
            fileDecorationManager.getStatusBarItem().text = '$(search) Listing ' + uri.path;

            try {
                const entries = await vscode.workspace.fs.readDirectory(uri);

                if (token.isCancellationRequested) {
                    reject(Error('Operation cancelled by user'));
                    return;
                }

                const promisesEntries: Promise<[vscode.Uri, vscode.FileType][]>[] = [];

                for (const fileEntry of entries) {
                    promisesEntries.push(
                        new Promise<[vscode.Uri, vscode.FileType][]>(async (resolve, reject) => {
                            const res: [vscode.Uri, vscode.FileType][] = [];

                            try {
                                if (token.isCancellationRequested) {
                                    reject(Error('Operation cancelled by user'));
                                    return;
                                }

                                const fileName = fileEntry[0];
            
                                logger.appendLineToMessages('[upload-from-local] Processing file entry: ' + fileName);
                                var localPath = uri.with({ path: upath.join(uri.path, fileName) });
                                var fileType = fileEntry[1];
            
                                if (fileType === vscode.FileType.SymbolicLink) {
                                    logger.appendLineToMessages('[upload-from-local] Cannot follow symbolic link: ' + localPath.path);
                                } else  if (fileType === vscode.FileType.File) {
                                    res.push([localPath, fileType]);
                                } else if(fileType === vscode.FileType.Directory) {
                                    // We need to go deeper
                                    const resDir = await this.listLocalFolder(localPath, token);
                                    resDir.forEach((r) => {
                                        res.push(r);
                                    });
                                }

                                resolve(res);
                            } catch(ex: any) {
                                reject(ex);
                            }
                        })
                    );
                }

                const res: [vscode.Uri, vscode.FileType][] = [];
                const promisesRes = await Promise.all(promisesEntries);
                promisesRes.forEach((r) => {
                    r.forEach((r2) => {
                        res.push(r2);
                    });
                });
                resolve(res);
            } catch(ex: any) {
                reject(ex);
            }
        });
    }

    private async listRemoteFolder(uri: vscode.Uri,  token: vscode.CancellationToken): Promise<[vscode.Uri, vscode.FileType][]> {
        return new Promise(async (resolve, reject) => {
            if (token.isCancellationRequested) {
                reject(Error('Operation cancelled by user'));
                return;
            }
            
            const connectionProvider = await this.getConnection('heavy');
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                reject(Error('Broken connection to SFTP server.'));
                return;
            }

            // Uri for local folder
            logger.appendLineToMessages('[download-from-remote] Listing dir: ' + uri.path);
            fileDecorationManager.getStatusBarItem().text = '$(search) Listing ' + uri.path;
            connection.readdir(uri.path, async (err, entries) => {
                this.releaseConnection(connectionProvider);

                if (err) {
                    reject(err);
                    return;
                }

                if (token.isCancellationRequested) {
                    reject(Error('Operation cancelled by user'));
                    return;
                }

                try {
                    const promisesEntries: Promise<[vscode.Uri, vscode.FileType][]>[] = [];

                    for (const fileEntry of entries) {
                        promisesEntries.push(
                            new Promise<[vscode.Uri, vscode.FileType][]>(async (resolve, reject) => {
                                const res: [vscode.Uri, vscode.FileType][] = [];

                                try {
                                    if (token.isCancellationRequested) {
                                        reject(Error('Operation cancelled by user'));
                                        return;
                                    }
                
                                    logger.appendLineToMessages('[download-from-remote] Processing file entry: ' + fileEntry.filename);
                
                                    var remotePath = uri.with({ path: upath.join(uri.path, fileEntry.filename) });
                                    var fileType = (fileEntry.attrs.isFile() ? vscode.FileType.File : (fileEntry.attrs.isDirectory() ? vscode.FileType.Directory : (fileEntry.attrs.isSymbolicLink() ? vscode.FileType.SymbolicLink : vscode.FileType.Unknown)));
                
                                    if (fileType === vscode.FileType.SymbolicLink) {
                                        logger.appendLineToMessages('[download-from-remote] Following symbolic link: ' + remotePath.path);
                                        remotePath = await this.followSymbolicLinkAndGetRealPath(remotePath);
                                        fileType = (await this.stat(remotePath)).type;
                                    }
                
                                    if (fileEntry.attrs.isFile()) {
                                        res.push([remotePath, fileType]);
                                    } else if(fileEntry.attrs.isDirectory()) {
                                        // We need to go deeper
                                        const resDir = await this.listRemoteFolder(remotePath, token);
                                        resDir.forEach((r) => {
                                            res.push(r);
                                        });
                                    }
    
                                    resolve(res);
                                } catch(ex: any) {
                                    reject(ex);
                                }
                            })
                        );
                    }

                    const res: [vscode.Uri, vscode.FileType][] = [];
                    const promisesRes = await Promise.all(promisesEntries);
                    promisesRes.forEach((r) => {
                        r.forEach((r2) => {
                            res.push(r2);
                        });
                    });
                    resolve(res);
                } catch(ex: any) {
                    reject(ex);
                }
            });
        });
    }

    private async uploadAllFiles(filesWithUri: [vscode.Uri, vscode.FileType][], progress: vscode.Progress<{ message?: string; increment?: number; }>, token: vscode.CancellationToken): Promise<void> {
        // Expected that uri is already verified as Directory.
        return new Promise(async (resolve, reject) => {
            if (token.isCancellationRequested) {
                reject(Error('Operation cancelled by user'));
                return;
            }
            
            try {
                const promisesEntries: Promise<any>[] = [];

                for (const fileEntry of filesWithUri) {
                    const fileType = fileEntry[1];
                    const localPath = fileEntry[0];

                    if (fileType === vscode.FileType.Directory) {
                        // Directories can be safely skip, because directories are created before uploading a file.
                        continue;
                    }

                    promisesEntries.push(
                        new Promise<void>(async (resolve, reject) => {
                            try {
                                if (token.isCancellationRequested) {
                                    reject(Error('Operation cancelled by user'));
                                    return;
                                }
            
                                if (fileType === vscode.FileType.File) {
                                    logger.appendLineToMessages('[upload-from-local] Uploading file: ' + localPath.path);
                                    // In case of file, upload it
                                    await this.uploadLocalFileToRemoteIfNeeded(localPath, 'heavy', token);
                                    fileDecorationManager.setUpToDateFileDecoration(localPath);
                                    this.uploadedCount++;
                                    progress.report({
                                        message: '(' + this.uploadedCount + ' of ' + this.uploadCount + ') ' + localPath.path,
                                        increment: this.uploadedProgress
                                    });
                                }

                                resolve();
                            } catch(ex: any) {
                                reject(ex);
                            }
                        })
                    );
                }

                await Promise.all(promisesEntries);
                resolve();
            } catch(ex: any) {
                reject(ex);
            }
        });
    }

    private async downloadAllFiles(filesWithUri: [vscode.Uri, vscode.FileType][], progress: vscode.Progress<{ message?: string; increment?: number; }>, token: vscode.CancellationToken): Promise<void> {
        // Expected that uri is already verified as Directory.
        return new Promise(async (resolve, reject) => {
            if (token.isCancellationRequested) {
                reject(Error('Operation cancelled by user'));
                return;
            }
            
            try {
                const promisesEntries: Promise<any>[] = [];

                for (const fileEntry of filesWithUri) {
                    const fileType = fileEntry[1];
                    const remotePath = fileEntry[0];

                    if (fileType === vscode.FileType.Directory) {
                        // Directories can be safely skip, because directories are created before downloading a file.
                        continue;
                    }

                    promisesEntries.push(
                        new Promise<void>(async (resolve, reject) => {
                            try {
                                if (token.isCancellationRequested) {
                                    reject(Error('Operation cancelled by user'));
                                    return;
                                }
            
                                if (fileType === vscode.FileType.File) {
                                    logger.appendLineToMessages('[download-from-remote] Downloading file: ' + remotePath.path);
                                    // In case of file, download it
                                    await this.downloadRemoteFileToLocalIfNeeded(remotePath, false, 'heavy', token);
                                    fileDecorationManager.setUpToDateFileDecoration(remotePath);
                                    this.downloadedCount++;
                                    progress.report({
                                        message: '(' + this.downloadedCount + ' of ' + this.downloadCount + ') ' + remotePath.path,
                                        increment: this.downloadedProgress
                                    });
                                }

                                resolve();
                            } catch(ex: any) {
                                reject(ex);
                            }
                        })
                    );
                }

                await Promise.all(promisesEntries);
                resolve();
            } catch(ex: any) {
                reject(ex);
            }
        });
    }

    async uploadLocalFileToRemoteIfNeeded(uri: vscode.Uri, connectionType: PoolType, parentToken: vscode.CancellationToken | undefined = undefined): Promise<Uint8Array | undefined> {
        return new Promise(async (resolve, reject) => {
            dd
        });
    }

    async downloadRemoteFileToLocalIfNeeded(uri: vscode.Uri, readFile: boolean, connectionType: PoolType, parentToken: vscode.CancellationToken | undefined = undefined): Promise<Uint8Array | undefined> {
        return new Promise(async (resolve, reject) => {
            logger.appendLineToMessages('[read-file] ' + uri.path);

            const connectionProvider = await this.getConnection(connectionType);
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                await this.releaseConnection(connectionProvider);
                reject(Error('Broken connection to SFTP server.'));
                return;
            }

            if (parentToken?.isCancellationRequested) {
                await this.releaseConnection(connectionProvider);
                reject(Error('Operation cancelled by user.'));
                return;
            }

            connection.lstat(uri.path, async(error, remoteStat) => {
                if (error) {
                    await this.releaseConnection(connectionProvider);
                    reject(error);
                    return;
                }

                if (parentToken?.isCancellationRequested) {
                    await this.releaseConnection(connectionProvider);
                    reject(Error('Operation cancelled by user.'));
                    return;
                }

                const calculatedLocalFile = this.getLocalFileUri(uri);

                try {
                    const fileType = this.getFileTypeByStats(remoteStat);

                    var realStats = remoteStat;
                    if (fileType === vscode.FileType.SymbolicLink) {
                        if (connection === undefined) {
                            await this.releaseConnection(connectionProvider);
                            reject(Error('Broken connection to SFTP server.'));
                            return;
                        }

                        if (parentToken?.isCancellationRequested) {
                            await this.releaseConnection(connectionProvider);
                            reject(Error('Operation cancelled by user.'));
                            return;
                        }

                        try {
                            realStats = await this.followSymbolicLinkAndGetStats(connection, uri);
                        } finally {
                            await this.releaseConnection(connectionProvider);
                        }
                    }

                    // check if exists in local
                    const localFileStat = await this.statLocalFileByUri(calculatedLocalFile);

                    if (parentToken?.isCancellationRequested) {
                        reject(Error('Operation cancelled by user.'));
                        await this.releaseConnection(connectionProvider);
                        return;
                    }

                    if (localFileStat !== undefined) {
                        const comparisonResult = await this.resolveWhatFileIsNewer(localFileStat, remoteStat);
                        if (comparisonResult === 'same') {
                            logger.appendLineToMessages('[read-file] ' + uri.path + ' -> Local file exists and is the same as remote, using local file., rmtime: ' + (remoteStat.mtime * 1000) + ', ltime: ' + localFileStat.mtime);
                            
                            if (!readFile) {
                                resolve(undefined);
                                await this.releaseConnection(connectionProvider);
                                return;
                            }

                            const res = await vscode.workspace.fs.readFile(calculatedLocalFile);
                            await this.releaseConnection(connectionProvider);
                            resolve(res);

                            fileDecorationManager.setUpToDateFileDecoration(uri);

                            return;
                        } else if(comparisonResult === 'local_newer') {
                            logger.appendLineToMessages('[read-file] ' + uri.path + ' -> Local file exists and is newer than remote, rmtime: ' + (remoteStat.mtime * 1000) + ', ltime: ' + localFileStat.mtime);
                            
                            if (!readFile) {
                                await this.releaseConnection(connectionProvider);
                                resolve(undefined);
                                return;
                            }
                            
                            const res = await vscode.workspace.fs.readFile(calculatedLocalFile);
                            await this.releaseConnection(connectionProvider);
                            resolve(res);

                            fileDecorationManager.setUpToDateFileDecoration(uri);

                            return;
                        } else if(comparisonResult === 'remote_newer') {
                            fileDecorationManager.setRemoteDownloadFileDecoration(uri);
                            logger.appendLineToMessages('[read-file] ' + uri.path + ' -> Remote is newer than local file, download needed, rmtime: ' + (remoteStat.mtime * 1000) + ', ltime: ' + localFileStat.mtime);
                        } else if(comparisonResult === 'same_mtime_different_size') {
                            // TODO: how handle this conflict?
                            fileDecorationManager.setUnknownStateFileDecoration(uri);
                            logger.appendLineToMessages('[read-file] ' + uri.path + ' -> Remote and local have same mtime, but different sizes, download needed., rmtime: ' + (remoteStat.mtime * 1000) + ', ltime: ' + localFileStat.mtime);
                        }
                    }

                    if (parentToken?.isCancellationRequested) {
                        await this.releaseConnection(connectionProvider);
                        reject(Error('Operation cancelled by user.'));
                        return;
                    }

                    // TODO: Configuration, if more than 30mb show progress
                    const fileSize = remoteStat.size;
                    const filename = this.getFilename(uri);
                    var res : Uint8Array | undefined = undefined;
                    
                    // TODO: Configuration
                    logger.appendLineToMessages('[download-file ' + filename + '] [fast-get] remote: ' + uri.path + ', local: ' + calculatedLocalFile.fsPath);

                    // Try to create directory if not exists
                    const localDirToMake = this.getDirectoryPath(calculatedLocalFile);
                    const lockFolder = this.addWatchLockFromLocalUri(localDirToMake);

                    try {
                        await vscode.workspace.fs.createDirectory(localDirToMake);
                    } finally {
                        this.removeWatchLock(lockFolder);
                    }

                    const lockFile = this.addWatchLockFromLocalUri(calculatedLocalFile);

                    // Download process can be took much time, prevent lock from expiration
                    lockFile.preventExpire = false;

                    fileDecorationManager.getStatusBarItem().text = '$(cloud-download) ' + uri.path;

                    if (fileSize > (1024) * (1024) * 10) {
                        // More than 10mb, do in progressive notification.
                        res = await vscode.window.withProgress({
                            cancellable: true,
                            location: vscode.ProgressLocation.Notification,
                            title: 'Downloading ' + filename + '...'
                        }, (progress, token) => {
                            return new Promise<Uint8Array| undefined>(async (resolveProgress, rejectProgress) => {
                                try {
                                    if (connection === undefined) {
                                        await this.releaseConnection(connectionProvider);
                                        reject(Error('Broken connection to SFTP server.'));
                                        return;
                                    }

                                    if (parentToken?.isCancellationRequested || token.isCancellationRequested) {
                                        await this.releaseConnection(connectionProvider);
                                        reject(Error('Operation cancelled by user.'));
                                        return;
                                    }

                                    const res = await this.readFileFromRemote(
                                        connection,
                                        uri,
                                        calculatedLocalFile,
                                        remoteStat,
                                        filename,
                                        progress,
                                        readFile,
                                        lockFile,
                                        token,
                                        parentToken
                                    );
                                    await this.releaseConnection(connectionProvider);
                                    resolveProgress(res);
                                } catch(ex: any) {
                                    await this.releaseConnection(connectionProvider);
                                    rejectProgress(ex);
                                }
                            });
                        });
                    } else {
                        if (connection === undefined) {
                            await this.releaseConnection(connectionProvider);
                            reject(Error('Broken connection to SFTP server.'));
                            return;
                        }

                        if (parentToken?.isCancellationRequested) {
                            await this.releaseConnection(connectionProvider);
                            reject(Error('Operation cancelled by user.'));
                            return;
                        }

                        // Less than 10mb, do directly.
                        try {
                            res = await this.readFileFromRemote(
                                connection,
                                uri,
                                calculatedLocalFile,
                                remoteStat,
                                filename,
                                undefined,
                                readFile,
                                lockFile,
                                undefined,
                                parentToken
                            );
                        } finally {
                            await this.releaseConnection(connectionProvider);
                        }
                    }

                    fileDecorationManager.setUpToDateFileDecoration(uri);
                    logger.appendLineToMessages('[download-file] Completed for: ' + filename);
                    await this.releaseConnection(connectionProvider);
                    resolve(res);
                } catch(ex: any) {
                    await this.releaseConnection(connectionProvider);
                    
                    // Remove local file at it may be in an invalid state...
                    await vscode.workspace.fs.delete(calculatedLocalFile, { recursive: true, useTrash: false });
                    fileDecorationManager.setRemoteFileDecoration(uri);

                    logger.appendLineToMessages('Cannot read file (' + this.remoteName + '): ' + ex.message);
                    vscode.window.showErrorMessage(ex.message);
                    reject(ex);
                }
            });
        });
    }

    private async readFileFromRemote(
        connection: SFTPWrapper, 
        uri: vscode.Uri, 
        calculatedLocalFile: vscode.Uri, 
        remoteStat: Stats, 
        filename: string,
        progress: vscode.Progress<{
            message?: string;
            increment?: number;
        }> | undefined,
        readFile: boolean,
        lockFile: WatchLock,
        token: vscode.CancellationToken | undefined, 
        parentToken: vscode.CancellationToken | undefined
    ): Promise<Uint8Array| undefined> {
        return new Promise((resolve, reject) => {
            connection.fastGet(
                uri.path, 
                calculatedLocalFile.fsPath, 
                {
                    fileSize: remoteStat.size,
                    step(total, nb, fileSize) {
                        if (token !== undefined && token.isCancellationRequested || parentToken !== undefined && parentToken.isCancellationRequested) {
                            reject(Error('Download cancelled by user.'));
                            throw Error('Download cancelled by user.');
                        }
                        logger.appendLineToMessages('[download-file ' + filename + '] Progress "' + total + '" of "' + fileSize + '" transferred.');
                        progress?.report({ increment: (nb / fileSize) * 100 }); 
                    }
                }, 
                async (err) => {
                    this.removeWatchLock(lockFile);
                    
                    if (err) {
                        reject(err);
                        return;
                    }
    
                    // read local file
                    if (readFile) {
                        const lock = this.addWatchLockFromLocalUri(calculatedLocalFile);
                        try {
                            const data = await vscode.workspace.fs.readFile(calculatedLocalFile);
                            resolve(data);
                        } catch(ex: any) {
                            logger.appendLineToMessages('Cannot read file (' + this.remoteName + '): ' + ex.message);
                            vscode.window.showErrorMessage(ex.message);
                            reject(err);
                        } finally {
                            this.removeWatchLock(lock);
                        }
                    } else {
                        resolve(undefined);
                    }
                }
            );
        });
    }

    async getConnection(type: PoolType) {
        logger.appendLineToMessages('[connection] Trying to acquire "' + type + '" connection.');
        return (await (await connectionManager.get(this.remoteName)?.getPool(type))?.acquire());
    }

    async releaseConnection(connection: ConnectionProvider | undefined) {
        try {
            if (connection === undefined) {
                return;
            }

            logger.appendLineToMessages('[connection] Releasing "' + connection.type + '" connection.');
            
            (await connectionManager.get(this.remoteName)?.getPool(connection.type))?.release(connection);

            logger.appendLineToMessages('[connection] Connection "' + connection.type + '" released.');
        } catch(ex: any) {
            logger.appendErrorToMessages('Error releasing connection:', ex);
            // Do nothing...
        }
    }

    getLocalFileUri(uri: vscode.Uri) {
        return this.workDirPath.with({ path: upath.join(this.workDirPath.fsPath, uri.path) });
    }

    getRemoteFileUri(uri: vscode.Uri): vscode.Uri {
        const basePath = uri.path.toLowerCase().replace(this.workDirPath.path.toLowerCase(), '');
        return uri.with({
            scheme: 'sftp',
            authority: this.remoteName,
            path: basePath
        });
    }

    private _fireSoon(...events: vscode.FileChangeEvent[]): void {
		this._bufferedEvents.push(...events);

		if (this._fireSoonHandle) {
			clearTimeout(this._fireSoonHandle);
		}

		this._fireSoonHandle = setTimeout(() => {
			this._emitter.fire(this._bufferedEvents);
			this._bufferedEvents.length = 0;
		}, 5);
	}

    private addWatchLockFromRemoteUri(remoteUri: vscode.Uri): WatchLock {
        const localPath = this.getLocalFileUri(remoteUri);
        logger.appendLineToMessages('[watcher] Adding locking for: ' + localPath.fsPath);
        const lock = new WatchLock(localPath);
        this._watchLocks.set(lock.uuid, lock);
        return lock;
    }

    private addWatchLockFromLocalUri(localPath: vscode.Uri): WatchLock {
        logger.appendLineToMessages('[watcher] Adding locking for: ' + localPath.fsPath);
        const lock = new WatchLock(localPath);
        this._watchLocks.set(lock.uuid, lock);
        return lock;
    }

    private removeWatchLock(lock: WatchLock) {
        this._watchLocks.delete(lock.uuid);
        logger.appendLineToMessages('[watcher] Remove locking for: ' + lock.lockedEntry.fsPath);
    }

    private isWatchLocked(uri: vscode.Uri) {
        for (const entry of this._watchLocks) {
            if (entry[1].lockedEntry.toString() === uri.toString()) {
                return true;
            }
        }

        return false;
    }

    private isWatchLockPresent(lock: WatchLock) {
        return this._watchLocks.has(lock.uuid);
    }

    private pruneExpiredLocks() {
        const expiredEntries: UUID[] = [];
        for (const entry of this._watchLocks) {
            if (entry[1].shouldExpire()) {
                expiredEntries.push(entry[0]);
            }
        }
        if (expiredEntries.length !== 0) {
            logger.appendLineToMessages('[warn] [watcher-cleanup] ' + expiredEntries.length + ' locks expired, that should not happen.');
            expiredEntries.forEach((uuid) => {
                this._watchLocks.delete(uuid);
            });
        }
    }

    async dispose() {
        console.log('Removing file watcher...');
        await this.workDirWatcher.dispose();
        clearInterval(this.watchLocksCleanupTask);
    }

    async removeLocalFile(uri: vscode.Uri, token: vscode.CancellationToken) {
        const localPath = this.getLocalFileUri(uri);

        const stat = await this.statLocalFileByUri(localPath);
        if (stat === undefined) {
            vscode.window.showInformationMessage('There is not a local version of this file.');
            return;
        }

        const urisToUpdate: vscode.Uri[] = [];
        (await this.listLocalAndGetUris(localPath, token)).forEach((u) => urisToUpdate.push(u));

        if (token.isCancellationRequested) {
            throw Error('Remove local file: Operation cancelled.');
        }

        //TODO: Make it cancellable...
        await vscode.workspace.fs.delete(localPath, { recursive: true, useTrash: true });

        for (const uri of urisToUpdate) {
            fileDecorationManager.setRemoteFileDecoration(uri);
        }
    }

    private async listLocalAndGetUris(uri: vscode.Uri, token: vscode.CancellationToken) {
        const res: vscode.Uri[] = [];
        const stat = await this.statLocalFileByUri(uri);

        if (token.isCancellationRequested) {
            throw Error('Remove local file: Operation cancelled.');
        }

        res.push(this.getRemoteFileUri(uri));
        if (stat !== undefined) {
            if (stat.type === vscode.FileType.Directory) {
                if (token.isCancellationRequested) {
                    throw Error('Remove local file: Operation cancelled.');
                }
                const files = await vscode.workspace.fs.readDirectory(uri);
                for (const fileEntry of files) {
                    if (token.isCancellationRequested) {
                        throw Error('Remove local file: Operation cancelled.');
                    }
                    const fileUri = uri.with({ path: upath.join(uri.path, fileEntry[0]) });
                    res.push(this.getRemoteFileUri(fileUri));
                    if (fileEntry[1] === vscode.FileType.Directory) {
                        const recursive = await this.listLocalAndGetUris(fileUri, token);
                        recursive.forEach((u) => {
                            res.push(u);
                        });
                    }
                }
            }
        }

        return res;
    }

    sendUpdateForRootFolder(workspaceUri: vscode.Uri) {
        setTimeout(async () => {
            console.warn('Fired changed');
            await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
        }, 1500);
    }
}

export enum ErrorCodes {
    FILE_NOT_FOUND = 2,
    PERMISSION_DENIED = 3,
    FILE_EXISTS = 4,
}

export class WatchLock {
    uuid = randomUUID();
    lockedEntry: vscode.Uri;
    created = Date.now();
    lifeTimeMs: number;
    preventExpire = false;

    constructor(lockedEntry: vscode.Uri, lifeTimeMs: number = 5000) {
        this.lockedEntry = lockedEntry;
        this.lifeTimeMs = lifeTimeMs;
    }

    shouldExpire() {
        if (this.preventExpire) {
            return false;
        }
        return (Date.now() - this.created) > this.lifeTimeMs;
    }
}
