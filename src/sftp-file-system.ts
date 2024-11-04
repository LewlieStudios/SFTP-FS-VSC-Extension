import * as vscode from 'vscode';
import logger from './logger';
import configuration, { RemoteConfiguration } from './configuration';
import connectionManager, { ConnectionProvider } from './connection-manager';
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
    workDirName!: string;
    workdDirWatcher!: vscode.FileSystemWatcher;
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
        this.workDirName = current.split('/').pop()!;

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
        this.workdDirWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(this.workDirPath, '**/*')
        );

        this.workdDirWatcher.onDidCreate(async (uri) => {
            if (true) {
                // Disabled for now, rework required.
                return;
            }

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
        });

        this.workdDirWatcher.onDidDelete(async (uri) => {
            if (true) {
                // Disabled for now, rework required.
                return;
            }

            if (this.isWatchLocked(uri) || this.isVCFocused) {
                return;
            }

            const relativePath = uri.path.replace(this.workDirPath.path, '');
            const remotePath = vscode.Uri.parse('sftp://' + this.remoteName + '/' + this.workDirName + '' + relativePath);
            console.log('[watcher-changes] File deleted outside VC: ' + uri.path + ', RelativePath: ' + relativePath);
            console.log('[watcher-changes] Deleting from: ' + remotePath);

            await this.delete(remotePath, { recursive: true });
            this._fireSoon({ type: vscode.FileChangeType.Deleted, uri: remotePath });
        });

        this.workdDirWatcher.onDidChange(async (uri) => {
            if (true) {
                // Disabled for now, rework required.
                return;
            }

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

            if (!uri.path.startsWith('/' + this.workDirName)) {
                logger.appendLineToMessages('[stat] Skipped stat: ' + uri.path);
                reject(vscode.FileSystemError.FileNotFound(uri));
                return;
            }

            try {
                await this.setupFileSystem(uri);
                const realUri = this.resolveRealPath(uri);
                const connectionProvider = await this.getConnection();
                const connection = connectionProvider?.getSFTP();

                if (connection === undefined) {
                    logger.appendLineToMessages('Error when stat file (' + this.remoteName + '): Connection lost.');
                    vscode.window.showErrorMessage('Broken connection to SFTP server.');
                    return;
                }

                try {
                    logger.appendLineToMessages('[stat] ' + realUri.path);
                    connection!.lstat(realUri.path, async (err: any, stats) => {
                        if (err) {
                            await this.releaseConnection(connectionProvider);

                            if (err.code === ErrorCodes.FILE_NOT_FOUND) {
                                logger.appendLineToMessages('File not found when stat file (' + this.remoteName + '): ' + realUri.path);
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
                                fileStats = await this.followSymbolicLinkAndGetStats(connection, realUri);
                                fileType = this.getFileTypeByStats(fileStats);
                            }

                            // Check local file
                            var calculatedLocalFile = this.getLocalFileUri(realUri);
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
                        logger.appendErrorToMessages('File not found when stat file (' + this.remoteName + '): ' + realUri.path, error);
                        reject(vscode.FileSystemError.FileNotFound(uri));
                    } else {
                        logger.appendErrorToMessages('Error when stat file (' + this.remoteName + '): ' + realUri.path, error);
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

                const connectionProvider = await this.getConnection();
                const connection = connectionProvider?.getSFTP();
                if (connection === undefined) {
                    throw Error('Broken connection to SFTP server.');
                }

                connection.readdir(realUri.path, async (err, stats) => {
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
                                entryStats = await this.followSymbolicLinkAndGetStats(connection, realUri.with({ path: upath.join(realUri.path, entry.filename) }));
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
                                    if (res === 'local_newer' || res === "same") {
                                        fileDecorationManager.setUpToDateFileDecoration(realUri.with({ path: upath.join(uri.path, entry.filename) }));
                                    } else if(res === 'remote_newer') {
                                        fileDecorationManager.setRemoteDownloadFileDecoration(realUri.with({ path: upath.join(uri.path, entry.filename) }));
                                    } else {
                                        fileDecorationManager.setUnknownStateFileDecoration(realUri.with({ path: upath.join(uri.path, entry.filename) }));
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

                if (!uri.path.startsWith('/' + this.workDirName)) {
                    resolve(new Uint8Array());
                    return;
                }

                const data = await this.downloadRemoteFileToLocalIfNeeded(uri, true);
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
            const connectionProvider = await this.getConnection();
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                reject(Error('[write-file] SFTP connection lost'));
                return;
            }

            // First, try to know if the file exists at server side.
            const realPath = this.resolveRealPath(uri);
            const localPath = this.getLocalFileUri(realPath);
            const lock = this.addWatchLockFromLocalUri(localPath);

            // Prevent expiration, because all operations involved in this logic can took long time to complete...
            lock.preventExpire = true;

            connection.lstat(realPath.path, async (err: any, stats) => {
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
                    logger.appendLineToMessages('[write-file] Local file updated with content, uploading file to remote..., targetPath:' + realPath.path + ', localFile: ' + localPath.fsPath);

                    statLocal = await this.statLocalFileByUri(localPath);
                    const filename = this.getFilename(realPath);

                    // upload file to remote
                    await vscode.window.withProgress({
                        cancellable: false,
                        location: vscode.ProgressLocation.Notification,
                        title: 'Uploading ' + filename + '...'
                    }, (progress) => {
                        return new Promise<void>(async (resolveProgress, rejectProgress) => {
                            connection.fastPut(
                                localPath.fsPath, 
                                realPath.path,
                                {
                                    fileSize: statLocal!.size,
                                    step(total, nb, fsize) {
                                        logger.appendLineToMessages('[upload-file ' + filename + '] Progress "' + total + '" of "' + fsize + '" transferred.');
                                        progress.report({ increment: (nb / fsize) * 100 }); 
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

                    logger.appendLineToMessages('[write-file] Write completed, mtime must be updated for: ' + realPath.path);
                    connection.lstat(realPath.path, async (err: any, stats) => {
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

    createDirectory(uri: vscode.Uri): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            await this.setupFileSystem(uri);
            const connectionProvider = await this.getConnection();
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                reject(Error('Connection to SFTP lost.'));
                return;
            }

            const realPath = this.resolveRealPath(uri);
            logger.appendLineToMessages('[create dir] ' + realPath.path);
            connection.mkdir(realPath.path, async (err) => {
              if (err) {
                this.releaseConnection(connectionProvider);
                return reject(err);
              }
              this.releaseConnection(connectionProvider);

              // Create local directory
              const localPath = this.getLocalFileUri(realPath);

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
    }

    async delete(uri: vscode.Uri, options: { readonly recursive: boolean; }): Promise<void> {
        await this.setupFileSystem(uri);

        const connectionProvider = await this.getConnection();
        const connection = connectionProvider?.getSFTP();
        if (connection === undefined) {
            throw Error('Connection to SFTP server lost.');
        }

        try {
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
                        await this.deleteDirectory(uri, recursive, connection, token);
                    });
                } else {
                    await this.deleteDirectory(uri, recursive, connection, undefined);
                }
            } else {
                logger.appendLineToMessages('[delete] Delete file: ' + realPath.path);
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
        const realPath = this.resolveRealPath(uri);
        return new Promise<void>((resolve, reject) => {
            if (token?.isCancellationRequested) {
                reject(Error('Deleting task cancelled by user.'));
                return;
            }
            logger.appendLineToMessages('Deleting remote file ' + realPath.path);
            vscode.window.setStatusBarMessage('Deleting ' + realPath.path + '...', 1000);
            client.unlink(realPath.path, async (err) => {
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
        const realPath = this.resolveRealPath(uri);
        return new Promise<void>((resolve, reject) => {
            if (token?.isCancellationRequested) {
                reject(Error('Deleting task cancelled by user.'));
                return;
            }

            if (!recursive) {
                logger.appendLineToMessages('Deleting remote folder ' + realPath.path);
                vscode.window.setStatusBarMessage('Deleting ' + realPath.path + '...', 1000);
                client.rmdir(realPath.path, async (err) => {
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
                            const childUri = realPath.with({ path: upath.join(uri.path, filename) });
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
            const connectionProvider = await this.getConnection();
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                reject(Error('Connection to SFTP server lost.'));
                return;
            }

            const realOldUri = this.resolveRealPath(oldUri);
            const realNewUri = this.resolveRealPath(newUri);
            logger.appendLineToMessages('[rename] From ' + realOldUri.path + ' to ' + realNewUri.path);
            connection.rename(realOldUri.path, realNewUri.path, async (err) => {
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

    async followSymbolicLinkAndGetRealPath(realUri: vscode.Uri, connectionSFTP: SFTPWrapper | undefined = undefined): Promise<vscode.Uri> {
        var connection = connectionSFTP;
        var connectionProvider: ConnectionProvider | undefined = undefined;

        if (connection === undefined) {
            connectionProvider = await this.getConnection();
            connection = connectionProvider?.getSFTP();
        }

        if (connection === undefined) {
            logger.appendLineToMessages('Error when stat file (' + this.remoteName + '): Connection lost.');
            vscode.window.showErrorMessage('Broken connection to SFTP server.');
            throw (Error('Broken connection to SFTP server.'));
        }

        try {
            await this.releaseConnection(connectionProvider);
            return await this.asyncfollowSymbolicLinkAndGetRealPath(connection, realUri);
        } catch(ex: any) {
            await this.releaseConnection(connectionProvider);
            throw ex;
        }
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

    async downloadRemoteFolderToLocal(uri: vscode.Uri, token: vscode.CancellationToken): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const realUri = this.resolveRealPath(uri);
            logger.appendLineToMessages('[read-file] ' + realUri.path);

            const connectionProvider = await this.getConnection();
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                reject(Error('Broken connection to SFTP server.'));
                return;
            }

            connection.lstat(realUri.path, async(error, remoteStat) => {
                await this.releaseConnection(connectionProvider);

                if (error) {
                    reject(error);
                    return;
                }

                if (!remoteStat.isDirectory()) {
                    reject(Error('Remote file is not a directory.'));
                    return;
                }

                // Start download process...
                try {
                    fileDecorationManager.getStatusBarItem().text = '$(search) Listing ' + realUri.path;
                    await this.downloadRemoteFolderToLocalInternal(realUri, token);
                    resolve();
                } catch(ex: any) {
                    reject(ex);
                }
            });
        });
    }

    private async downloadRemoteFolderToLocalInternal(uri: vscode.Uri, token: vscode.CancellationToken): Promise<void> {
        // Expected that uri is already verified as Directory.
        return new Promise(async (resolve, reject) => {
            if (token.isCancellationRequested) {
                reject(Error('Operation cancelled by user'));
                return;
            }
            
            const connectionProvider = await this.getConnection();
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                reject(Error('Broken connection to SFTP server.'));
                return;
            }

            // Uri for local folder
            logger.appendLineToMessages('[download-from-remote] Reading dir: ' + uri.path);
            fileDecorationManager.getStatusBarItem().text = '$(search) Listing ' + uri.path;
            connection.readdir(uri.path, async (err, entries) => {
                this.releaseConnection(connectionProvider);

                if (err) {
                    reject(err);
                    return;
                }

                try {
                    const promisesEntries: Promise<any>[] = [];

                    for (const fileEntry of entries) {
                        promisesEntries.push(
                            new Promise<void>(async (resolve, reject) => {
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
                                        logger.appendLineToMessages('[download-from-remote] Downloading file: ' + remotePath.path);
                                        // In case of file, download it
                                        await this.downloadRemoteFileToLocalIfNeeded(remotePath, false, token);
                                        fileDecorationManager.setUpToDateFileDecoration(remotePath);
                                    } else if(fileEntry.attrs.isDirectory()) {
                                        logger.appendLineToMessages('[download-from-remote] Directory found while reading dir: ' + remotePath.path);
                                        // We need to go deeper
                                        await this.downloadRemoteFolderToLocal(remotePath, token);
                                        fileDecorationManager.setDirectoryFileDecoration(remotePath);
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
        });
    }

    async downloadRemoteFileToLocalIfNeeded(uri: vscode.Uri, readFile: boolean, parentToken: vscode.CancellationToken | undefined = undefined): Promise<Uint8Array | undefined> {
        return new Promise(async (resolve, reject) => {
            
            const realUri = this.resolveRealPath(uri);
            logger.appendLineToMessages('[read-file] ' + realUri.path);

            const connectionProvider = await this.getConnection();
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                reject(Error('Broken connection to SFTP server.'));
                return;
            }

            if (parentToken?.isCancellationRequested) {
                reject(Error('Operation cancelled by user.'));
                return;
            }

            connection.lstat(realUri.path, async(error, remoteStat) => {
                if (error) {
                    await this.releaseConnection(connectionProvider);
                    reject(error);
                    return;
                }

                if (parentToken?.isCancellationRequested) {
                    reject(Error('Operation cancelled by user.'));
                    return;
                }

                const calculatedLocalFile = this.getLocalFileUri(realUri);

                try {
                    const fileType = this.getFileTypeByStats(remoteStat);

                    var realStats = remoteStat;
                    if (fileType === vscode.FileType.SymbolicLink) {
                        realStats = await this.followSymbolicLinkAndGetStats(connection, realUri);
                    }

                    // check if exists in local
                    const localFileStat = await this.statLocalFileByUri(calculatedLocalFile);

                    if (parentToken?.isCancellationRequested) {
                        reject(Error('Operation cancelled by user.'));
                        return;
                    }

                    if (localFileStat !== undefined) {
                        const comparisionResult = await this.resolveWhatFileIsNewer(localFileStat, remoteStat);
                        if (comparisionResult === 'same') {
                            logger.appendLineToMessages('[read-file] ' + realUri.path + ' -> Local file exists and is the same as remote, using local file., rmtime: ' + (remoteStat.mtime * 1000) + ', ltime: ' + localFileStat.mtime);
                            
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
                        } else if(comparisionResult === 'local_newer') {
                            logger.appendLineToMessages('[read-file] ' + realUri.path + ' -> Local file exists and is newer than remote, rmtime: ' + (remoteStat.mtime * 1000) + ', ltime: ' + localFileStat.mtime);
                            
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
                        } else if(comparisionResult === 'remote_newer') {
                            fileDecorationManager.setRemoteDownloadFileDecoration(uri);
                            logger.appendLineToMessages('[read-file] ' + realUri.path + ' -> Remote is newer than local file, download needed, rmtime: ' + (remoteStat.mtime * 1000) + ', ltime: ' + localFileStat.mtime);
                        } else if(comparisionResult === 'same_mtime_different_size') {
                            // TODO: how handle this conflict?
                            fileDecorationManager.setUnknownStateFileDecoration(uri);
                            logger.appendLineToMessages('[read-file] ' + realUri.path + ' -> Remote and local have same mtime, but different sizes, download needed., rmtime: ' + (remoteStat.mtime * 1000) + ', ltime: ' + localFileStat.mtime);
                        }
                    }

                    if (parentToken?.isCancellationRequested) {
                        reject(Error('Operation cancelled by user.'));
                        return;
                    }

                    // TODO: Configuration, if more than 30mb show progress
                    const fileSize = remoteStat.size;
                    const filename = this.getFilename(realUri);
                    var res : Uint8Array | undefined = undefined;
                    
                    // TODO: Configuration
                    logger.appendLineToMessages('[download-file ' + filename + '] [fast-get] remote: ' + realUri.path + ', local: ' + calculatedLocalFile.fsPath);

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

                    fileDecorationManager.getStatusBarItem().text = '$(cloud-download) ' + realUri.path;

                    if (fileSize > (1024) * (1024) * 10) {
                        // More than 10mb, do in progressive notification.
                        res = await vscode.window.withProgress({
                            cancellable: true,
                            location: vscode.ProgressLocation.Notification,
                            title: 'Downloading ' + filename + '...'
                        }, (progress, token) => {
                            return new Promise<Uint8Array| undefined>(async (resolveProgress, rejectProgress) => {
                                try {
                                    const res = await this.readFileFromRemote(
                                        connection,
                                        realUri,
                                        calculatedLocalFile,
                                        remoteStat,
                                        filename,
                                        progress,
                                        readFile,
                                        lockFile,
                                        token,
                                        parentToken
                                    );
                                    resolveProgress(res);
                                } catch(ex: any) {
                                    rejectProgress(ex);
                                }
                            });
                        });
                    } else {
                        // Less than 10mb, do directly.
                        res = await this.readFileFromRemote(
                            connection,
                            realUri,
                            calculatedLocalFile,
                            remoteStat,
                            filename,
                            undefined,
                            readFile,
                            lockFile,
                            undefined,
                            parentToken
                        );
                    }

                    fileDecorationManager.setUpToDateFileDecoration(uri);
                    logger.appendLineToMessages('[download-file] Completed for: ' + filename);
                    await this.releaseConnection(connectionProvider);
                    resolve(res);
                } catch(ex: any) {
                    // Remove local file at it may be in an invalid state...
                    await vscode.workspace.fs.delete(calculatedLocalFile, { recursive: true, useTrash: false });
                    fileDecorationManager.setRemoteFileDecoration(uri);

                    logger.appendLineToMessages('Cannot read file (' + this.remoteName + '): ' + ex.message);
                    vscode.window.showErrorMessage(ex.message);
                    await this.releaseConnection(connectionProvider);
                    reject(ex);
                }
            });
        });
    }

    private async readFileFromRemote(
        connection: SFTPWrapper, 
        realUri: vscode.Uri, 
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
                realUri.path, 
                calculatedLocalFile.fsPath, 
                {
                    fileSize: remoteStat.size,
                    step(total, nb, fsize) {
                        if (token !== undefined && token.isCancellationRequested || parentToken !== undefined && parentToken.isCancellationRequested) {
                            reject(Error('Download cancelled by user.'));
                            throw Error('Download cancelled by user.');
                        }
                        logger.appendLineToMessages('[download-file ' + filename + '] Progress "' + total + '" of "' + fsize + '" transferred.');
                        progress?.report({ increment: (nb / fsize) * 100 }); 
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

    async getConnection() {
        logger.appendLineToMessages('[connection] Trying to acquire connection.');
        return (await connectionManager.get(this.remoteName)?.getPool()?.acquire());
    }

    async releaseConnection(connection: ConnectionProvider | undefined) {
        logger.appendLineToMessages('[connection] Releasing connection.');
        try {
            if (connection === undefined) {
                return;
            }
            connectionManager.get(this.remoteName)?.getPool()?.release(connection);
        } catch(ex: any) {
            logger.appendErrorToMessages('Error releasing connection:', ex);
            // Do nothing...
        }
    }

    getLocalFileUri(uri: vscode.Uri) {
        const realUri = this.resolveRealPath(uri);
        return this.workDirPath.with({ path: upath.join(this.workDirPath.fsPath, realUri.path) });
    }

    getRemoteFileUri(uri: vscode.Uri): vscode.Uri {
        const basePath = uri.path.replace(this.workDirPath.path, '');
        return uri.with({
            scheme: 'sftp',
            authority: this.remoteName,
            path: '/' + upath.join(this.workDirName, basePath)
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
        const realPath = this.resolveRealPath(remoteUri);
        const localPath = this.getLocalFileUri(realPath);
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

    dispose() {
        console.log('Removing file watcher...');
        this.workdDirWatcher.dispose();
        clearInterval(this.watchLocksCleanupTask);
    }

    async removeLocalFile(uri: vscode.Uri, token: vscode.CancellationToken) {
        const realPath = this.resolveRealPath(uri);
        const localPath = this.getLocalFileUri(realPath);

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
