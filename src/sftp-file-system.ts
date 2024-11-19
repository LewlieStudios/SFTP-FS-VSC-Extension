import * as vscode from 'vscode';
import logger from './logger.js';
import configuration, { RemoteConfiguration } from './configuration.js';
import connectionManager, { ConnectionProvider, PoolType } from './connection-manager.js';
import { FileEntryWithStats, SFTPWrapper, Stats } from 'ssh2';
import upath from 'upath';
import * as childProcess from 'child_process';
import fileDecorationManager from './file-decoration-manager.js';
import fs from 'fs';
import { randomUUID, UUID } from 'crypto';

export class SFTPFileSystemProvider implements vscode.FileSystemProvider {
    static instance: SFTPFileSystemProvider | undefined = undefined;

    private sftpFileProvidersDataByRemotes = new Map<string, SFTPFileProviderData>();
	private _bufferedEvents: vscode.FileChangeEvent[] = [];
	private _fireSoonHandle?: NodeJS.Timeout;
    private readonly _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;
    private _watchLocks: Map<UUID, WatchLock> = new Map();
    private isVCFocused = false;
    watchLocksCleanupTask: NodeJS.Timeout;
    cachedDirectoriesCleanupTask: NodeJS.Timeout;
    requestedDirectoriesCleanupTask: NodeJS.Timeout;
    requestedDirectoriesThreshold = new Map<string, RequestedDirectoryThreshold>();

    constructor() {
        SFTPFileSystemProvider.instance = this;

        this.watchLocksCleanupTask = setInterval(() => {
            // prune old locks
            this.pruneExpiredLocks();
        }, 1000);

        this.cachedDirectoriesCleanupTask = setInterval(() => {
            for (const data of this.sftpFileProvidersDataByRemotes) {
                const fileProviderData = data[1];
                fileProviderData.cleanCachedDirectories();
            }
        }, 1000);

        this.requestedDirectoriesCleanupTask = setInterval(() => {
            const keysToRemove: string[] = [];
            for (const entry of this.requestedDirectoriesThreshold) {
                const key = entry[0];
                const val = entry[1];
                if (Date.now() - val.timestamp >= 10_000) {
                    // More than 10s, prune this.
                    keysToRemove.push(key);
                }
            }
            for (const key of keysToRemove) {
                this.requestedDirectoriesThreshold.delete(key);
            }
        }, 1000);

        this.isVCFocused = vscode.window.state.focused;
        vscode.window.onDidChangeWindowState((state) => {
            this.isVCFocused = state.focused;
        });
    }

    getSystemProviderData(remoteName: string) {
        return this.sftpFileProvidersDataByRemotes.get(remoteName);
    }

    getRemoteName(uri: vscode.Uri) {
        if (uri.scheme !== 'sftp') {
            throw Error('Expected sftp uri');
        }

        return uri.authority;
    }

    private setupFileSystem(uri: vscode.Uri) {
        if (this.getSystemProviderData(uri.authority) !== undefined) {
            return;
        }

        const newData = new SFTPFileProviderData();
        newData.setupDone = true;
        newData.remoteName = uri.authority;
        newData.remoteConfiguration = configuration.getRemoteConfiguration(newData.remoteName) ?? {};
        const current = (configuration.getWorkDirForRemote(newData.remoteName));
        if (current === undefined) {
            throw Error("Working directory not found for this SFTP file provider.");
        }
        newData.workDirPath = vscode.Uri.file(current);
        //this.workDirName = current.split('/').pop()!;
        if(!connectionManager.poolExists(newData.remoteName)) {
            console.log('Creating connections pool!');
            connectionManager.createPool({
                configuration: newData.remoteConfiguration,
                remoteName: newData.remoteName
            });
        }

        console.log('Creating file watcher...');
        newData.workDirWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(newData.workDirPath, '**/*')
        );

        newData.workDirWatcher.onDidCreate(async (uri) => {
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
                const remotePath = vscode.Uri.parse('sftp://' + remoteName + '/' + this.workDirName + '' + relativePath);
                console.log('[watcher-changes] File created outside VC: ' + uri.path + ', RelativePath: ' + relativePath);
                console.log('[watcher-changes] Uploading to: ' + remotePath);

                const content = await vscode.workspace.fs.readFile(uri);
                await this.writeFile(remotePath, content, { create: true, overwrite: true });
                this._fireSoon({ type: vscode.FileChangeType.Created, uri: remotePath });
            } else if(localStat.type === vscode.FileType.Directory) {
                const relativePath = uri.path.replace(this.workDirPath.path, '');
                const remotePath = vscode.Uri.parse('sftp://' + remoteName + '/' + this.workDirName + '' + relativePath);
                console.log('[watcher-changes] Folder created outside VC: ' + uri.path + ', RelativePath: ' + relativePath);
                console.log('[watcher-changes] Creating folder to: ' + remotePath);
                await this.createDirectory(remotePath);
                this._fireSoon({ type: vscode.FileChangeType.Created, uri: remotePath });
            }
            */
        });

        newData.workDirWatcher.onDidDelete(async (uri) => {
            if (true) {
                // Disabled for now, rework required.
                return;
            }

            /*
            if (this.isWatchLocked(uri) || this.isVCFocused) {
                return;
            }

            const relativePath = uri.path.replace(this.workDirPath.path, '');
            const remotePath = vscode.Uri.parse('sftp://' + remoteName + '/' + this.workDirName + '' + relativePath);
            console.log('[watcher-changes] File deleted outside VC: ' + uri.path + ', RelativePath: ' + relativePath);
            console.log('[watcher-changes] Deleting from: ' + remotePath);

            await this.delete(remotePath, { recursive: true });
            this._fireSoon({ type: vscode.FileChangeType.Deleted, uri: remotePath });
            */
        });

        newData.workDirWatcher.onDidChange(async (uri) => {
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
                const remotePath = vscode.Uri.parse('sftp://' + remoteName + '/' + this.workDirName + '' + relativePath);
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

        this.sftpFileProvidersDataByRemotes.set(newData.remoteName, newData);
    }

    watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[] }): vscode.Disposable {
        this.setupFileSystem(uri);
        return new vscode.Disposable(() => {});
    }

    stat(uri: vscode.Uri): Promise<vscode.FileStat> | vscode.FileStat {
        return this.$stat(uri, true, 'passive');
    }

    $stat(uri: vscode.Uri, fallbackToLocalFile: boolean, connectionType: PoolType): Promise<vscode.FileStat> | vscode.FileStat {
        const remoteName = this.getRemoteName(uri);

        if (uri.path === '/') {
            return {
                type: vscode.FileType.Directory,
                ctime: Date.now(),
                mtime: Date.now(),
                size: 0,
            };
        }

        if (uri.path.startsWith('/.vscode')) {
            logger.appendLineToMessages('[stat] Skipped stat: ' + uri.path);
            throw vscode.FileSystemError.FileNotFound(uri);
        }

        if (uri.path.startsWith('/.git')) {
            logger.appendLineToMessages('[stat] Skipped stat: ' + uri.path);
            throw vscode.FileSystemError.FileNotFound(uri);
        }

        this.setupFileSystem(uri);

        // Cache - Check if entry is already cached
        logger.appendLineToMessages('[stat] ' + uri.path);

        const parentDirUri = uri.with({ path: upath.dirname(uri.path) });
        const cachedDirectory = this.getSystemProviderData(remoteName)!.getCachedStatDirectory(parentDirUri);
        if (cachedDirectory !== undefined) {
            logger.appendLineToMessages('[stat] Cached directory found for parent of ' + uri.path + ': ' + parentDirUri.path);
            const files = cachedDirectory.files;

            for (const file of files) {
                if(file.filename === upath.basename(uri.path)) {
                    console.log('[stat] Cached file found ' + file.filename + ' from parent folder ' + parentDirUri.path + ', skipping stat from remote...');
                    return {
                        ctime: 0,
                        mtime: file.attrs.mtime,
                        size: file.attrs.size,
                        type: this.getFileTypeByStats(file.attrs)
                    };
                }
            }

            // Okay, directory is cached, but file do not exists, so... what is the action that we should to do?

            if (fallbackToLocalFile) {
                // If fallback is required then try to fallback it...

                // If not exists probably it is a local file that is still not uploaded to remote...
                return new Promise(async (resolve, reject) => {
                    const localUri = this.getLocalFileUri(remoteName, uri);
                    const localStats = await this.statLocalFileByUri(localUri);

                    if (localStats === undefined) {
                        // Okay, definitively it do not exists.
                        logger.appendLineToMessages('File not found when stat file (' + remoteName + '): ' + uri.path);
                        reject(vscode.FileSystemError.FileNotFound(uri));
                        return;
                    } else {
                        fileDecorationManager.setLocalNewFileDecoration(uri);
                        resolve(localStats);
                    }
                });
            } else {
                // File do not exists, and local file is not used as fallback
                throw vscode.FileSystemError.FileNotFound(uri);
            }
        }

        return new Promise(async (resolve, reject) => {
            try {
                const localUri = this.getLocalFileUri(remoteName, uri);
                // If it is a directory stored locally then return it to improve performance.
                const localStats = await this.statLocalFileByUri(localUri);
                console.info('TRYING LOCAL: ' + localUri.toString());
                console.info('RES: ' + localStats?.type);

                if (localStats !== undefined && localStats.type === vscode.FileType.Directory) {
                    console.info('RESOLVED');
                    resolve(localStats);
                    return;
                }

                const connectionProvider = await this.getConnection(remoteName, connectionType);
                const connection = connectionProvider?.getSFTP();

                if (connection === undefined) {
                    logger.appendLineToMessages('Error when stat file (' + remoteName + '): Connection lost.');
                    vscode.window.showErrorMessage('Broken connection to SFTP server.');
                    return;
                }

                try {
                    logger.appendLineToMessages('[stat] Not cached: ' + uri.path);

                    // Read content of parent folder an cache it
                    logger.appendLineToMessages('[stat] Trying to read directory for cache: ' + parentDirUri.path);

                    // Read the entire directory and cache, to speedup stat operation
                    // Note: readdir already gets the stats of all files, so we can use that result
                    // to get the stat of the requested file...
                    var parentDirStatResult: FileEntryWithStats[] | undefined = undefined;

                    if (this.shouldCacheDirectory(parentDirUri)) {
                        logger.appendLineToMessages('[stat] [cache] Should cache this directory: ' + parentDirUri.path);
                        parentDirStatResult = await new Promise<FileEntryWithStats[]>((resolve, reject) => {
                            connection.stat(parentDirUri.path, (err: any) => {
                                if (err) {
                                    if (err.code === ErrorCodes.FILE_NOT_FOUND) {
                                        logger.appendErrorToMessages('$stat', 'File not found when stat directory for cache (' + remoteName + '): ' + uri.path, err);
                                        reject(vscode.FileSystemError.FileNotFound(uri));
                                    } else {
                                        reject(err);
                                    }
                                    return;
                                }
    
                                connection.readdir(parentDirUri.path, async (err, list) => {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
        
                                    try {
                                        // Cache all directory to improve speed.
                                        this.getSystemProviderData(this.getRemoteName(uri))!.addCachedStatDirectory(
                                            uri.with({ path: parentDirUri.path }),
                                            list
                                        );
        
                                        resolve(list);
                                    } catch(ex: any) {
                                        reject(ex);
                                    }
                                });
                            });
                        });
                    } else {
                        logger.appendLineToMessages('[stat] [cache] Cache is not required for: ' + parentDirUri.path);
                    }

                    try {
                        var statsToUse: Stats | vscode.FileStat | undefined = undefined;

                        // try to get the file from the readdir result...
                        if (parentDirStatResult !== undefined) {
                            for (const entry of parentDirStatResult) {
                                const entryPath = uri.with({ path: upath.join(parentDirUri.path, entry.filename) });
                                if (entryPath.path === uri.path) {
                                    // file exists!
                                    statsToUse = entry.attrs;
                                }
                            }
                        } else {
                            statsToUse = await new Promise((resolve ,reject) => {
                                connection.lstat(uri.path, (err: any, stat) => {
                                    if (err) {
                                        if (err.code === ErrorCodes.FILE_NOT_FOUND) {
                                            logger.appendErrorToMessages('$stat', 'File not found when stat directory for cache (' + remoteName + '): ' + uri.path, err);
                                            reject(vscode.FileSystemError.FileNotFound(uri));
                                        } else {
                                            reject(err);
                                        }
                                        return;
                                    }

                                    resolve(stat);
                                });
                            });
                        }

                        var isLocalOnly = false;

                        // Undefined means that the file does not exists on remote...
                        if (statsToUse === undefined) {
                            if (fallbackToLocalFile) {
                                // If not exists probably it is a local file that is still not uploaded to remote...
                                const localUri = this.getLocalFileUri(remoteName, uri);
                                const localStats = await this.statLocalFileByUri(localUri);

                                if (localStats === undefined) {
                                    // Okay, definitively it do not exists.
                                    logger.appendLineToMessages('File not found when stat file (' + remoteName + '): ' + uri.path);
                                    this.releaseConnection(remoteName, connectionProvider);
                                    reject(vscode.FileSystemError.FileNotFound(uri));
                                    return;
                                } else {
                                    statsToUse = localStats;
                                    isLocalOnly = true;
                                }
                            } else {
                                // File do not exists, and local file is not used as fallback
                                this.releaseConnection(remoteName, connectionProvider);
                                reject(vscode.FileSystemError.FileNotFound(uri));
                                return;
                            }
                        }

                        const res = await this.$statPerform(uri, connection, statsToUse, isLocalOnly);
                        await this.releaseConnection(remoteName, connectionProvider);
                        resolve(res);
                    } catch(ex: any) {
                        await this.releaseConnection(remoteName, connectionProvider);
                        logger.appendErrorToMessages('$stat', 'Error on (' + remoteName + '): ' + uri.path, ex);
                        reject(ex);
                    }
                } catch(error: any) {
                    await this.releaseConnection(remoteName, connectionProvider);
                    if (error.code === ErrorCodes.FILE_NOT_FOUND || error instanceof vscode.FileSystemError.FileNotFound) {
                        logger.appendErrorToMessages('$stat', 'File not found when stat file (' + remoteName + '): ' + uri.path, error);
                        reject(vscode.FileSystemError.FileNotFound(uri));
                    } else {
                        console.log(error);
                        logger.appendErrorToMessages('$stat', 'Error when stat file (' + remoteName + '): ' + uri.path, error);
                        vscode.window.showErrorMessage(error.message);
                        reject(error);
                    }
                }
            } catch(ex: any) {
                reject(ex);
            }
        });
    }

    async $statPerform(uri: vscode.Uri, connection: SFTPWrapper, fileStats: Stats | vscode.FileStat, isLocalOnly: boolean) {
        const remoteName = this.getRemoteName(uri);
        
        logger.appendLineToMessages('[stat] $statPerform for ' + uri.path);

        return new Promise<vscode.FileStat>(async (resolve, reject) => {
            try {
                var fileType = (isLocalOnly) ? (fileStats as vscode.FileStat).type : this.getFileTypeByStats(fileStats as Stats);

                if (fileType === vscode.FileType.SymbolicLink) {
                    if (isLocalOnly) {
                        // TODO: Must follow symbolic link for local??
                        reject(vscode.FileSystemError.FileNotFound(uri));
                        return;
                    }
                    
                    fileStats = await this.followSymbolicLinkAndGetStats(connection, uri);
                    fileType = this.getFileTypeByStats(fileStats);
                }

                // Check local file
                if (isLocalOnly) {
                    fileDecorationManager.setLocalNewFileDecoration(uri);
                } else {
                    var calculatedLocalFile = this.getLocalFileUri(remoteName, uri);
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
                                if (res === "same") {
                                    fileDecorationManager.setUpToDateFileDecoration(uri);
                                } else if(res === 'local_newer') {
                                    fileDecorationManager.setLocalUploadFileDecoration(uri);
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
                }

                resolve({
                    type: fileType,
                    ctime: 0,
                    mtime: fileStats.mtime,
                    size: fileStats.size
                });
            } catch(ex: any) {
                reject(ex);
            }
        });
    }

    async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        const remoteName = this.getRemoteName(uri);

        return new Promise(async (resolve, reject) => {
            try {
                this.setupFileSystem(uri);
                const workDirPath = this.getSystemProviderData(remoteName)!.workDirPath;

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

                const connectionProvider = await this.getConnection(remoteName, 'passive');
                const connection = connectionProvider?.getSFTP();
                if (connection === undefined) {
                    throw Error('Broken connection to SFTP server.');
                }

                // Resolve local files...
                const result: [string, vscode.FileType][] = [];
                const listLocalFunc = async (stats: FileEntryWithStats[] | undefined) => {
                    const localUri = this.getLocalFileUri(remoteName, uri);
                    const localStats = await this.statLocalFileByUri(localUri);

                    if (localStats !== undefined && localStats.type === vscode.FileType.Directory) {
                        // list files
                        const localFiles = await vscode.workspace.fs.readDirectory(localUri);

                        localFiles.forEach((local) => {
                            var found = false;

                            if (stats !== undefined) {
                                for (const entry of stats) {
                                    if (local[0].toLowerCase() === entry.filename.toLowerCase()) {
                                        found = true;
                                        break;
                                    }
                                }
                            }

                            if (!found) {
                                // Local file
                                result.push(local);
                                const entryLocalUri = localUri.with({ path: upath.join(localUri.path, local[0])});
                                const remoteLocalUri = this.getRemoteFileUri(remoteName, entryLocalUri);
                                fileDecorationManager.setLocalUploadFileDecoration(remoteLocalUri);
                            }
                        });
                    }
                };

                connection.readdir(uri.path, async (err: any, stats) => {
                    if(err) {
                        await this.releaseConnection(remoteName, connectionProvider);
                        await listLocalFunc(undefined);
                        resolve(result);
                        return;
                    }

                    try {
                        for (const entry of stats) {
                            var entryStats = entry.attrs;
                            var fileType = this.getFileTypeByStats(entryStats);

                            if (fileType === vscode.FileType.SymbolicLink) {
                                entryStats = await this.followSymbolicLinkAndGetStats(connection, uri.with({ path: upath.join(uri.path, entry.filename) }));
                                fileType = this.getFileTypeByStats(entryStats);
                            }

                            result.push([entry.filename, fileType]);

                            // Determine if there is a local version of this file.
                            var calculatedLocalFile = workDirPath.with({ path: upath.join(workDirPath.fsPath, upath.join(uri.path, entry.filename)) });
                            const localFileStat = await this.statLocalFileByUri(calculatedLocalFile);
                            if (localFileStat === undefined) {
                                fileDecorationManager.setRemoteFileDecoration(uri.with({ path: upath.join(uri.path, entry.filename) }));
                            } else {
                                if (localFileStat.type === vscode.FileType.Directory) {
                                    fileDecorationManager.setDirectoryFileDecoration(uri.with({ path: upath.join(uri.path, entry.filename) }));
                                } else {
                                    const res = await this.resolveWhatFileIsNewer(localFileStat, entryStats);
                                    if (res === "same") {
                                        fileDecorationManager.setUpToDateFileDecoration(uri.with({ path: upath.join(uri.path, entry.filename) }));
                                    } else if(res === 'local_newer') {
                                        fileDecorationManager.setLocalUploadFileDecoration(uri.with({ path: upath.join(uri.path, entry.filename) }));
                                    } else if(res === 'remote_newer') {
                                        fileDecorationManager.setRemoteDownloadFileDecoration(uri.with({ path: upath.join(uri.path, entry.filename) }));
                                    } else {
                                        fileDecorationManager.setUnknownStateFileDecoration(uri.with({ path: upath.join(uri.path, entry.filename) }));
                                    }
                                }
                            }
                        }

                        await listLocalFunc(stats);
                        await this.releaseConnection(remoteName, connectionProvider);
                        resolve(result);
                    } catch(ex: any) {
                        await this.releaseConnection(remoteName, connectionProvider);
                        reject(ex);
                    }
                });
            } catch(ex: any) {
                logger.appendLineToMessages('Cannot read directory (' + remoteName + '): ' + ex.message);
                vscode.window.showErrorMessage(ex.message);
                reject(ex);
            }
        });
    }

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        const remoteName = this.getRemoteName(uri);

        logger.appendLineToMessages('[read-file] Requested readfile from vs code for: ' + uri.path);

        return new Promise(async (resolve, reject) => {
            try {
                this.setupFileSystem(uri);

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

                const data = await this.downloadRemoteFileToLocalIfNeeded(uri, true, 'passive', false);
                resolve(data!);
            } catch(ex: any) {
                logger.appendLineToMessages('Cannot read file (' + remoteName + '): ' + ex.message);
                vscode.window.showErrorMessage(ex.message);
                reject(ex);
            }
        });
    }

    writeFile(uri: vscode.Uri, content: Uint8Array, options: { readonly create: boolean; readonly overwrite: boolean; }): Promise<void> {
        const remoteName = this.getRemoteName(uri);
        return new Promise( async (resolve, reject) => {
            this.setupFileSystem(uri);
            const connectionProvider = await this.getConnection(remoteName, 'passive');
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                reject(Error('[write-file] SFTP connection lost'));
                return;
            }

            // First, try to know if the file exists at server side.
            const localPath = this.getLocalFileUri(remoteName, uri);
            const lock = this.addWatchLockFromLocalUri(localPath);

            // Prevent expiration, because all operations involved in this logic can took long time to complete...
            lock.preventExpire = true;

            connection.lstat(uri.path, async (err: any, stats) => {
                try {
                    if (err) {
                        if (err.code === ErrorCodes.FILE_NOT_FOUND) {
                            // File not found and we will not try to create the file.
                            if (!options.create) {
                                this.releaseConnection(remoteName, connectionProvider);
                                this.removeWatchLock(lock);
                                reject(vscode.FileSystemError.FileNotFound(uri));
                                return;
                            }
                        } else {
                            this.releaseConnection(remoteName, connectionProvider);
                            this.removeWatchLock(lock);
                            logger.appendErrorToMessages('writeFile', 'Failed to lstat remote file:' + uri.path, err);
                            reject(err);
                            return;
                        }
                    } else {
                        // If file exists, and we will no try to overwrite
                        if(!options.overwrite) {
                            this.releaseConnection(remoteName, connectionProvider);
                            this.removeWatchLock(lock);
                            reject(vscode.FileSystemError.FileExists(uri));
                            logger.appendErrorToMessages('writeFile', 'Failed write file, file exists and overwrite is false:' + uri.path, err);
                            return;
                        }

                        // We will not try to write in symbolic links...
                        if(stats.isSymbolicLink()) {
                            this.releaseConnection(remoteName, connectionProvider);
                            this.removeWatchLock(lock);
                            reject(Error('Cannot write content, remote file is a symbolic link.'));
                            logger.appendErrorToMessages('writeFile', 'Failed write file, remote file is a symbolic link:' + uri.path, err);
                            return;
                        }

                        // We will not try to write in directories...
                        if(!stats.isFile()) {
                            this.releaseConnection(remoteName, connectionProvider);
                            this.removeWatchLock(lock);
                            reject(Error('Cannot write content, remote file is a directory.'));
                            logger.appendErrorToMessages('writeFile', 'Failed write file, remote file is a directory:' + uri.path, err);
                            return;
                        }
                    }

                    // Continue normally...
                    // First, write content to local file.
                    const statLocal = await this.statLocalFileByUri(localPath);

                    if (statLocal !== undefined && statLocal.type !== vscode.FileType.File) {
                        this.releaseConnection(remoteName, connectionProvider);
                        this.removeWatchLock(lock);
                        logger.appendLineToMessages('[write-file] Local file exists but is not a File: ' + localPath.fsPath);
                        reject(Error('Local file expected to be a file, but it was a directory, file location: ' + localPath.fsPath));
                        logger.appendErrorToMessages('writeFile', 'Local file is expected to be a file but a directory was found:' + localPath.path, err);
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
                        this.releaseConnection(remoteName, connectionProvider);
                        logger.appendErrorToMessages('writeFile', 'Failed to create local dir ' + parentDirectory.fsPath + ': ', ex);
                        reject(ex);
                        return;
                    } finally {
                        this.removeWatchLock(lock);
                        this.removeWatchLock(lock2);
                    }

                    // Write content to local file.
                    await vscode.workspace.fs.writeFile(localPath, content);
                    logger.appendLineToMessages('[write-file] Local file updated with content, uploading file to remote..., targetPath:' + uri.path + ', localFile: ' + localPath.fsPath);

                    // upload file to remote
                    this.releaseConnection(remoteName, connectionProvider);

                    await this.uploadLocalFileToRemoteIfNeeded(remoteName, localPath, 'passive', true);

                    this.removeWatchLock(lock);
                    this.removeWatchLock(lock2);
                    this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
                    resolve();
                } catch(ex: any) {
                    this.releaseConnection(remoteName, connectionProvider);
                    this.removeWatchLock(lock);
                    logger.appendErrorToMessages('writeFIle', 'Something went wrong for write operation: ' + uri.path, ex);
                    reject(ex);
                }
            });
        });
    }

    async createDirectory(uri: vscode.Uri): Promise<void> {
        const remoteName = this.getRemoteName(uri);

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            cancellable: false,
            title: 'Creating directory "' + uri.path + ' "...'
        }, () => {
            return new Promise<void>(async (resolve, reject) => {
                this.setupFileSystem(uri);
                const connectionProvider = await this.getConnection(remoteName, 'passive');
                const connection = connectionProvider?.getSFTP();
                if (connection === undefined) {
                    reject(Error('Connection to SFTP lost.'));
                    return;
                }
    
                logger.appendLineToMessages('[create dir] ' + uri.path);
                connection.mkdir(uri.path, async (err) => {
                  if (err) {
                    this.releaseConnection(remoteName, connectionProvider);
                    logger.appendErrorToMessages('writeFIle', 'Failed to create remote directory: ' + uri.path, err);
                    return reject(err);
                  }
                  this.releaseConnection(remoteName, connectionProvider);
    
                  // Create local directory
                  const localPath = this.getLocalFileUri(remoteName, uri);
    
                  const lock = this.addWatchLockFromLocalUri(localPath);
                  try {
                    logger.appendLineToMessages('[create local dir] ' + localPath.fsPath);
                    await vscode.workspace.fs.createDirectory(localPath);
                  } catch(ex: any) {
                    logger.appendErrorToMessages('createDirectory', 'Failed to create local directory: ' + localPath.fsPath, ex);
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
        const remoteName = this.getRemoteName(uri);
        this.setupFileSystem(uri);

        logger.appendLineToMessages('[delete] Delete request: ' + uri.path + ', recursive: ' + options.recursive);

        const connectionProvider = await this.getConnection(remoteName, 'heavy');
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

            const parentFolder = uri.with({ path: upath.dirname(uri.path) });
            this._fireSoon(
                { type: vscode.FileChangeType.Changed, uri: parentFolder },
                { uri, type: vscode.FileChangeType.Deleted }
            );

            await this.releaseConnection(remoteName, connectionProvider);
        } catch(ex: any) {
            logger.appendErrorToMessages('delete', 'Something went wrong for delete operation: ' + uri.path, ex);
            await this.releaseConnection(remoteName, connectionProvider);
            throw ex;
        }
    }

    private deleteFile(uri: vscode.Uri, connection: SFTPWrapper, token: vscode.CancellationToken | undefined) {
        const remoteName = this.getRemoteName(uri);

        return new Promise<void>((resolve, reject) => {
            if (token?.isCancellationRequested) {
                reject(Error('Deleting task cancelled by user.'));
                return;
            }
            logger.appendLineToMessages('Deleting remote file ' + uri.path);
            vscode.window.setStatusBarMessage('Deleting ' + uri.path + '...', 1000);
            connection.unlink(uri.path, async (err) => {
                if (err) {
                    logger.appendErrorToMessages('deleteFile', 'Failed to unlink remote file: ' + uri.path, err);
                    reject(err);
                    return;
                }

                // Delete local file...
                const localPath = this.getLocalFileUri(remoteName, uri);
                const lock = this.addWatchLockFromLocalUri(localPath);
                try {
                    await vscode.workspace.fs.delete(localPath, { recursive: true, useTrash: false });
                } catch(ex: any) {
                    logger.appendErrorToMessages('deleteFile', 'Failed to delete local folder: ' + localPath.fsPath, ex);
                } finally {
                    this.removeWatchLock(lock);
                }

                const parentFolder = uri.with({ path: upath.dirname(uri.path) });
                const filename = upath.basename(uri.path);
                this.getSystemProviderData(remoteName)!.removeFileFromCachedFolder(parentFolder, filename);

                resolve();
            });
        });
    }

    private deleteDirectory(uri: vscode.Uri, recursive: boolean, client: SFTPWrapper, token: vscode.CancellationToken | undefined) {
        const remoteName = this.getRemoteName(uri);

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
                        logger.appendErrorToMessages('deleteDirectory', 'Failed to delete remote directory: ' + uri.path, err);
                        reject(err);
                        return;
                    }

                    // Delete local directory...
                    const localPath = this.getLocalFileUri(remoteName, uri);
                    const lock = this.addWatchLockFromLocalUri(localPath);
                    try {
                        await vscode.workspace.fs.delete(localPath, { recursive: true, useTrash: false });
                    } catch(ex: any) {
                        logger.appendErrorToMessages('deleteDirectory', 'Failed to delete local directory: ' + localPath.fsPath, ex);
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
                        logger.appendErrorToMessages('deleteDirectory', 'Failed to perform recursive delete for directory: ' + uri.path, ex);
                        reject(ex);
                    }
                },
                err => {
                reject(err);
                }
            ).catch((ex) => {
                logger.appendErrorToMessages('deleteDirectory', 'Failed to read remote directory: ' + uri.path, ex);
                reject(ex);
            });
        });
    }

    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { readonly overwrite: boolean; }): Promise<void> {
        const remoteName = this.getRemoteName(oldUri);

        return new Promise(async (resolve, reject) => {
            this.setupFileSystem(oldUri);
            const connectionProvider = await this.getConnection(remoteName, 'passive');
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                reject(Error('Connection to SFTP server lost.'));
                return;
            }

            // Check if old uri exists, if not, then a local file is renamed!
            var isOldLocal = false;

            try {
                await this.$stat(oldUri, false, 'passive');
            } catch(ex: any) {
                if (ex instanceof vscode.FileSystemError || ex.code === ErrorCodes.FILE_NOT_FOUND) {
                    if (ex.code === 'FileNotFound' || ex.code === ErrorCodes.FILE_NOT_FOUND) {
                        // Okay, old uri is local only
                        isOldLocal = true;
                    } else {
                        this.releaseConnection(remoteName, connectionProvider);
                        logger.appendErrorToMessages('rename', 'Failed to stat remote oldUri: ' + oldUri.path, ex);
                        reject(ex);
                        return;
                    }
                } else {
                    this.releaseConnection(remoteName, connectionProvider);
                    logger.appendErrorToMessages('rename', 'Failed to stat remote oldUri: ' + oldUri.path, ex);
                    reject(ex);
                    return;
                }
            }

            if (isOldLocal) {
                try {
                    // Special logic! First we need to verify if the target exists on remote...
                    var targetExistsRemote = true;
                    try {
                        await this.$stat(newUri, false, 'passive');
                    } catch(ex: any) {
                        if (ex instanceof vscode.FileSystemError || ex.code === ErrorCodes.FILE_NOT_FOUND) {
                            if (ex.code === 'FileNotFound' || ex.code === ErrorCodes.FILE_NOT_FOUND) {
                                // Okay, new uri is local only
                                targetExistsRemote = false;
                            } else {
                                logger.appendErrorToMessages('rename', 'Failed to stat remote newUri: ' + newUri.path, ex);
                                this.releaseConnection(remoteName, connectionProvider);
                                reject(ex);
                                return;
                            }
                        } else {
                            this.releaseConnection(remoteName, connectionProvider);
                            reject(ex);
                            return;
                        }
                    }

                    if (targetExistsRemote) {
                        // Cannot rename!
                        this.releaseConnection(remoteName, connectionProvider);
                        const error = Error('Unable to rename, file "' + (newUri.path) + '" exists on remote server, remove remote file first.');
                        logger.appendErrorToMessages('rename', 'Failed to make operation, remote file exists: ' + newUri.path, error);
                        reject(error);
                        return;
                    }
                    
                    // Rename on local...
                    await vscode.workspace.fs.rename(
                        this.getLocalFileUri(remoteName, oldUri),
                        this.getLocalFileUri(remoteName, newUri)
                    );
                    resolve();
                } catch(ex: any) {
                    logger.appendErrorToMessages('rename', 'Failed to make operation, something went wrong: oldUri = ' + oldUri.path + ', newUri = ' + newUri.path, ex);
                    reject(ex);
                }
                return;
            }

            logger.appendLineToMessages('[rename] From ' + oldUri.path + ' to ' + newUri.path);
            connection.rename(oldUri.path, newUri.path, async (err) => {
                if (err) {
                    logger.appendErrorToMessages('rename', 'Failed to make operation, remote error: oldUri = ' + oldUri.path + ', newUri = ' + newUri.path, err);
                    this.releaseConnection(remoteName, connectionProvider);
                    reject(err);
                    return;
                }

                this.releaseConnection(remoteName, connectionProvider);

                // Rename local file too...
                const oldLocalUri = this.getLocalFileUri(remoteName, oldUri);
                const newLocalUri = this.getLocalFileUri(remoteName, newUri);

                const lock1 = this.addWatchLockFromLocalUri(oldLocalUri);
                const lock2 = this.addWatchLockFromLocalUri(newLocalUri);
                try {
                    const oldStats = this.statLocalFileByUri(oldLocalUri);
                    if (oldStats !== undefined) {
                        logger.appendLineToMessages('[rename-local] From ' + oldLocalUri.fsPath + ' to ' + newLocalUri.fsPath);
                        await vscode.workspace.fs.rename(oldLocalUri, newLocalUri, { overwrite: true});
                    }
                } catch(ex: any) {
                    logger.appendErrorToMessages('rename', 'Failed to make operation, local rename error: oldUri = ' + oldLocalUri.path + ', newUri = ' + newLocalUri.path, ex);
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
                        logger.appendErrorToMessages('followSymbolicLinkAndGetStats', 'Failed to follow symbolic link, lstat error: ' + uri.path, err);
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
        const remoteName = this.getRemoteName(uri);

        if (connection === undefined) {
            connectionProvider = await this.getConnection(remoteName, 'heavy');
            connection = connectionProvider?.getSFTP();
        }

        if (connection === undefined) {
            logger.appendLineToMessages('Error when stat file (' + remoteName + '): Connection lost.');
            vscode.window.showErrorMessage('Broken connection to SFTP server.');
            throw (Error('Broken connection to SFTP server.'));
        }

        try {
            await this.releaseConnection(remoteName, connectionProvider);
            return await this.asyncFollowSymbolicLinkAndGetRealPath(connection, uri);
        } catch(ex: any) {
            logger.appendErrorToMessages('followSymbolicLinkAndGetRealPath', 'Failed to follow symbolic link: ' + uri.path, ex);
            await this.releaseConnection(remoteName, connectionProvider);
            throw ex;
        }
    }

    asyncFollowSymbolicLinkAndGetRealPath(sftp: SFTPWrapper, uri: vscode.Uri): Promise<vscode.Uri> {
        return new Promise(async (resolve, reject) => {
            sftp.realpath(uri.path, (err, resolvedPath) => {
                if (err) {
                    logger.appendErrorToMessages('asyncFollowSymbolicLinkAndGetRealPath', 'Failed to follow symbolic link, realpath failed: ' + uri.path, err);
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
        } catch (error: any) {
          if ((error as vscode.FileSystemError).code === 'FileNotFound') {
            return undefined; // File does not exist
          }

          logger.appendErrorToMessages('statLocalFileByUri', 'Failed to stat local file: ' + uri.path, error);
          throw error; // Re-throw any other errors
        }
    }

    async resolveWhatFileIsNewer(localStats: vscode.FileStat, remoteStats: Stats | vscode.FileStat): Promise<'same' | 'local_newer' | 'remote_newer' | 'same_mtime_different_size'> {
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
            logger.appendErrorToMessages('resolveWhatFileIsNewer', 'Failed to compare files: ', error);
            throw new Error(`Error comparing files: ${error.message}`);
        }
    }

    async openLocalFolderInExplorer(uri: vscode.Uri) {
        let filePath = uri.fsPath;
    
        if (!filePath) {
            vscode.window.showErrorMessage("Invalid path.");
            return;
        }
    
        // Check if the URI is a file; if so, get its parent directory
        const stats = await vscode.workspace.fs.stat(uri);
        const isFile = stats.type === vscode.FileType.File;
        if (isFile) {
            const dirPath = upath.dirname(filePath);
            // Modify command to open folder with the file selected
            if (process.platform === 'win32') {
                // Windows - /select to highlight the file
                filePath = `/select,"${filePath}"`;
            } else if (process.platform === 'darwin') {
                // macOS - "open" with `-R` option to reveal the file in Finder
                filePath = `-R "${filePath}"`;
            } else {
                // Linux - open parent directory (Linux generally doesn’t highlight the file)
                filePath = `"${dirPath}"`;
            }
        }
    
        try {
            if (process.platform === 'win32') {
                childProcess.exec(`explorer ${filePath}`);
            } else if (process.platform === 'darwin') {
                childProcess.exec(`open ${filePath}`);
            } else {
                childProcess.exec(`xdg-open ${filePath}`);
            }
        } catch (error: any) {
            logger.appendErrorToMessages('openLocalFolderInExplorer', 'Failed to open file using system explorer: ' + uri.fsPath, error);
            vscode.window.showErrorMessage(`Failed to open folder: ${error.message}`);
        }
    }

    private downloadedCount = 0;
    private downloadCount = 0;
    private downloadedProgress = 0.0;

    private uploadedCount = 0;
    private uploadCount = 0;
    private uploadedProgress = 0.0;

    private syncedCount = 0;
    private syncCount = 0;
    private syncedProgress = 0.0;

    async syncRemoteFolderWithLocal(uri: vscode.Uri, progress: vscode.Progress<{ message?: string; increment?: number; }>, token: vscode.CancellationToken): Promise<void> {
        const remoteName = this.getRemoteName(uri);

        return new Promise(async (resolve, reject) => {
            try {
                logger.appendLineToMessages('[sync-files] ' + uri.path);

                const connectionProvider = await this.getConnection(remoteName, 'heavy');
                const connection = connectionProvider?.getSFTP();
                if (connection === undefined) {
                    reject(Error('Broken connection to SFTP server.'));
                    return;
                }

                connection.lstat(uri.path, async(error, remoteStat) => {
                    try {
                        await this.releaseConnection(remoteName, connectionProvider);

                        if (error) {
                            logger.appendErrorToMessages('syncRemoteFolderWithLocal', 'Failed to lstat remote file: ' + uri.fsPath, error);
                            reject(error);
                            return;
                        }

                        if (!remoteStat.isDirectory()) {
                            logger.appendErrorToMessages('syncRemoteFolderWithLocal', 'Remote file is not a directory: ' + uri.fsPath, Error('Remote file is not a directory.'));
                            reject(Error('Remote file is not a directory.'));
                            return;
                        }

                        // First, list local files
                        const localUri = this.getLocalFileUri(remoteName, uri);
                        const localFiles = await this.listLocalFolder(localUri, token);

                        // Next, list remote files
                        const remoteFiles = await this.listRemoteFolder(uri, token);

                        // Resolve the final list, comparing between the state of local and remote files
                        // If remote file is newer than our copy, remote file will be downloaded.
                        // If our local file is newer than remote file, local file will be uploaded.
                        // If both files has the same size and mtime, then nothing is done.
                        var operationsToPerform = await this.createOperationListForBothSync(remoteName, localFiles, remoteFiles, progress);

                        // Ask user if proceed...
                        const totalUpload = operationsToPerform.filter((o) => o[1] === 'UPLOAD_LOCAL').length;
                        const totalDownload = operationsToPerform.filter((o) => o[1] === 'DOWNLOAD_REMOTE').length;

                        if (totalUpload === 0 && totalDownload === 0) {
                            // Nothing to do...
                            vscode.window.showInformationMessage('All files up to-date.');
                            resolve();
                            return;
                        }

                        const nothingToDo = operationsToPerform.filter((o) => o[1] === 'NOTHING').length;

                        const dialogRes = await vscode.window.showInformationMessage(
                            (totalUpload + totalDownload) + ' operations will be performed (' + totalUpload + ' upload, ' + totalDownload + ' download, ' + nothingToDo + ' up to-date), do you want to continue?',
                            {
                                modal: true
                            },
                            "Yes",
                            "No"
                        );

                        if (dialogRes === 'No' || dialogRes === undefined) {
                            resolve();
                            return;
                        }

                        operationsToPerform = operationsToPerform.filter((o) => o[1] !== 'NOTHING');
                        this.syncedCount = 0;
                        this.syncCount = totalDownload + totalUpload;
                        this.syncedProgress = 100.0 / this.syncCount;

                        // Perform operations...
                        const parallel: Promise<void>[] = [];

                        for (const operationEntry of operationsToPerform) {
                            const uri = operationEntry[0];
                            const operation = operationEntry[1];

                            parallel.push(
                                new Promise(async (resolve, reject) => {
                                    try {
                                        if (operation === 'UPLOAD_LOCAL') {
                                            const localPath = this.getLocalFileUri(remoteName, uri);
                                            await this.uploadLocalFileToRemoteIfNeeded(remoteName, localPath, 'heavy', false, token, () => {
                                                progress.report({ increment: 0, message: '(' + this.syncedCount + ' of ' + this.syncCount + '): ' + uri.path });
                                            });
                                            fileDecorationManager.setUpToDateFileDecoration(uri);
                                            this.syncedCount++;
                                            progress.report({ increment: this.syncedProgress, message: '(' + this.syncedCount + ' of ' + this.syncCount + '): Completed ' + uri.path });
                                        } else if(operation === 'DOWNLOAD_REMOTE') {
                                            await this.downloadRemoteFileToLocalIfNeeded(uri, false, 'heavy', false, token, () => {
                                                progress.report({ increment: 0, message: '(' + this.syncedCount + ' of ' + this.syncCount + '): ' + uri.path });
                                            });
                                            fileDecorationManager.setUpToDateFileDecoration(uri);
                                            this.syncedCount++;
                                            progress.report({ increment: this.syncedProgress, message: '(' + this.syncedCount + ' of ' + this.syncCount + '): Completed ' + uri.path });
                                        }
    
                                        resolve();
                                    } catch(ex: any) {
                                        if (ex.code === ErrorCodes.FILE_NOT_FOUND) {
                                            logger.appendErrorToMessages('syncRemoteFolderWithLocal', 'File not found, but skipped because this can happen if the file was removed after the calculation of the operation list: ' + uri.fsPath + ', operation: ' + operation, ex);
                                            resolve();
                                            return;
                                        }

                                        logger.appendErrorToMessages('syncRemoteFolderWithLocal', 'Something went wrong: ' + uri.fsPath + ', operation: ' + operation, ex);
                                        reject(ex);
                                    }
                                })
                            );
                        }

                        await Promise.all(parallel);

                        resolve();
                    } catch(ex: any) {
                        logger.appendErrorToMessages('syncRemoteFolderWithLocal', 'Something went wrong: ' + uri.fsPath, ex);
                        reject(ex);
                    }
                });
            } catch(ex: any) {
                reject(ex);
            }
        });
    }

    private async createOperationListForBothSync(
        remoteName: string,
        localFiles: [vscode.Uri, vscode.FileType][], 
        remoteFiles: [vscode.Uri, vscode.FileType][],
        progress: vscode.Progress<{ message?: string; increment?: number; }>
    ): Promise<[vscode.Uri, SyncOperationType][]> {
        return new Promise(async (resolve, reject) => {
            try {
                logger.appendLineToMessages('[operations-sync] To analyze remote: ' + remoteFiles.length);

                const res: [vscode.Uri, SyncOperationType][] = [];
                const processedLocalList: vscode.Uri[] = [];
                var operationPromises: Promise<void>[] = [];
                                    
                fileDecorationManager.getStatusBarItem().text = '$(search) Creating operation list to perform, please wait...';
                progress.report({});

                for (const remoteEntry of remoteFiles) {
                    // Do in parallel...
                    const remoteUri = remoteEntry[0];
                    const remoteType = remoteEntry[1];

                    operationPromises.push(
                        new Promise<void>(async (resolve, reject) => {
                            try {
                                if (remoteType === vscode.FileType.File) {
                                    // Try to find the local counterpart.
                                    const localUri = this.getLocalFileUri(remoteName, remoteUri);
                                    const localStats = await this.statLocalFileByUri(localUri);

                                    processedLocalList.push(localUri);
                                    
                                    if (localStats === undefined) {
                                        // Local does not exists, so download is required.
                                        res.push([remoteUri, 'DOWNLOAD_REMOTE']);
                                        logger.appendLineToMessages('[operations-sync] Missing local file, resolution DOWNLOAD: ' + remoteUri.path);
                                        resolve();
                                        return;
                                    }

                                    const remoteStats = await this.$stat(remoteUri, false, 'heavy');
                                    const compare = await this.resolveWhatFileIsNewer(localStats, remoteStats);

                                    if (compare === 'local_newer') {
                                        // Upload required
                                        res.push([remoteUri, 'UPLOAD_LOCAL']);
                                        logger.appendLineToMessages('[operations-sync] Local file is newer, resolution UPLOAD: ' + remoteUri.path);
                                    } else if(compare === 'remote_newer') {
                                        // Download required
                                        res.push([remoteUri, 'DOWNLOAD_REMOTE']);
                                        logger.appendLineToMessages('[operations-sync] Remote file is newer, resolution DOWNLOAD: ' + remoteUri.path);
                                    } else {
                                        res.push([remoteUri, 'NOTHING']);
                                        logger.appendLineToMessages('[operations-sync] Both files are synced, resolution NOTHING: ' + remoteUri.path);
                                    }
                                }

                                resolve();
                            } catch(ex: any) {
                                logger.appendErrorToMessages('createOperationListForBothSync', 'Something went wrong while comparing files: ' + remoteUri.path, ex);
                                reject(ex);
                            }
                        })
                    );
                }

                await Promise.all(operationPromises);

                logger.appendLineToMessages('[operations-sync] To analyze local: ' + localFiles.length);
                // Process local files list...
                for (const localEntry of localFiles) {
                    const localUri = localEntry[0];
                    const localType = localEntry[1];

                    if (localType !== vscode.FileType.File) {
                        logger.appendLineToMessages('[operations-sync] Local file is not file, resolution DISCARD: ' + localUri.path);
                        continue;
                    }

                    // First, skip if the file is already processed.
                    var found = false;
                    for (const processedEntry of processedLocalList) {
                        if (processedEntry.path.toLowerCase() === localUri.path.toLowerCase()) {
                            found = true;
                            break;
                        }
                    }

                    if (found === true) {
                        logger.appendLineToMessages('[operations-sync] Local file already processed in remote list, resolution DISCARD: ' + localUri.path);
                        continue;
                    }

                    const remoteUri = this.getRemoteFileUri(remoteName, localUri);

                    // Then, upload is required because the counterpart is not present.
                    logger.appendLineToMessages('[operations-sync] Remote file is not present, resolution UPLOAD: ' + remoteUri.path);
                    res.push([remoteUri, 'UPLOAD_LOCAL']);
                }
                                    
                fileDecorationManager.getStatusBarItem().text = '$(cloud) Ready.';

                resolve(res);
            } catch(ex: any) {
                fileDecorationManager.getStatusBarItem().text = '$(cloud) Ready.';

                logger.appendErrorToMessages('createOperationListForBothSync', 'Something went wrong: ', ex);
                reject(ex);
            }
        });
    }

    async uploadRemoteFolderFromLocal(uri: vscode.Uri, progress: vscode.Progress<{ message?: string; increment?: number; }>, token: vscode.CancellationToken): Promise<void> {
        const remoteName = this.getRemoteName(uri);

        return new Promise(async (resolve, reject) => {
            logger.appendLineToMessages('[read-file] ' + uri.path);

            const connectionProvider = await this.getConnection(remoteName, 'heavy');
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                reject(Error('Broken connection to SFTP server.'));
                return;
            }

            connection.lstat(uri.path, async(error, remoteStat) => {
                await this.releaseConnection(remoteName, connectionProvider);

                if (error) {
                    logger.appendErrorToMessages('uploadRemoteFolderFromLocal', 'Failed to lstat remote: ' + uri.path, error);
                    reject(error);
                    return;
                }

                if (!remoteStat.isDirectory()) {
                    logger.appendErrorToMessages('uploadRemoteFolderFromLocal', 'Remote file is not a directory: ' + uri.path, Error());
                    reject(Error('Remote file is not a directory.'));
                    return;
                }

                // First, list all files.
                const localUri = this.getLocalFileUri(remoteName, uri);
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
                    await this.uploadAllFiles(remoteName, files, progress, token);
                    resolve();
                } catch(ex: any) {
                    logger.appendErrorToMessages('uploadRemoteFolderFromLocal', 'Something went wrong while doing updateAll operation: ' + uri.path, ex);
                    reject(ex);
                }
            });
        });
    }

    async downloadRemoteFolderToLocal(uri: vscode.Uri, progress: vscode.Progress<{ message?: string; increment?: number; }>, token: vscode.CancellationToken): Promise<void> {
        const remoteName = this.getRemoteName(uri);

        return new Promise(async (resolve, reject) => {
            logger.appendLineToMessages('[read-file] ' + uri.path);

            const connectionProvider = await this.getConnection(remoteName, 'heavy');
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                reject(Error('Broken connection to SFTP server.'));
                return;
            }

            connection.lstat(uri.path, async(error, remoteStat) => {
                await this.releaseConnection(remoteName, connectionProvider);

                if (error) {
                    logger.appendErrorToMessages('uploadRemoteFolderFromLocal', 'Failed to lstat remote file: ' + uri.path, error);
                    reject(error);
                    return;
                }

                if (!remoteStat.isDirectory()) {
                    logger.appendErrorToMessages('uploadRemoteFolderFromLocal', 'Remote file is not a directory: ' + uri.path, Error());
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
                    logger.appendErrorToMessages('uploadRemoteFolderFromLocal', 'Something went wrong while downloading all files: ' + uri.path, ex);
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
                                logger.appendErrorToMessages('listLocalFolder', 'Failed to list local folder: ' + uri.path, ex);
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
                if (ex instanceof vscode.FileSystemError && ex.code === 'FileNotFound') {
                    // Not found!
                    resolve([]);
                } else {
                    logger.appendErrorToMessages('listLocalFolder', 'Failed to list local folder, something went wrong: ' + uri.path, ex);
                    reject(ex);
                }
            }
        });
    }

    private async listRemoteFolder(uri: vscode.Uri,  token: vscode.CancellationToken): Promise<[vscode.Uri, vscode.FileType][]> {
        const remoteName = this.getRemoteName(uri);

        return new Promise(async (resolve, reject) => {
            if (token.isCancellationRequested) {
                reject(Error('Operation cancelled by user'));
                return;
            }
            
            const connectionProvider = await this.getConnection(remoteName, 'heavy');
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                reject(Error('Broken connection to SFTP server.'));
                return;
            }

            // Uri for local folder
            logger.appendLineToMessages('[download-from-remote] Listing dir: ' + uri.path);
            fileDecorationManager.getStatusBarItem().text = '$(search) Listing ' + uri.path;
            connection.readdir(uri.path, async (err, entries) => {
                this.releaseConnection(remoteName, connectionProvider);

                if (err) {
                    logger.appendErrorToMessages('listRemoteFolder', 'Failed to readdir: ' + uri.path, err);
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
                                    logger.appendErrorToMessages('listRemoteFolder', 'Failed to list remote directory, something went wrong: ' + uri.path, ex);
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
                    logger.appendErrorToMessages('listRemoteFolder', 'Failed to list remote directory, something went wrong: ' + uri.path, ex);
                    reject(ex);
                }
            });
        });
    }

    private async uploadAllFiles(remoteName: string, filesWithUri: [vscode.Uri, vscode.FileType][], progress: vscode.Progress<{ message?: string; increment?: number; }>, token: vscode.CancellationToken): Promise<void> {
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
                                    await this.uploadLocalFileToRemoteIfNeeded(remoteName, localPath, 'heavy', false, token);
                                    const remotePath = this.getRemoteFileUri(remoteName, localPath);
                                    fileDecorationManager.setUpToDateFileDecoration(remotePath);
                                    this.uploadedCount++;
                                    progress.report({
                                        message: '(' + this.uploadedCount + ' of ' + this.uploadCount + ') ' + localPath.path,
                                        increment: this.uploadedProgress
                                    });
                                }

                                resolve();
                            } catch(ex: any) {
                                if (ex.code === ErrorCodes.FILE_NOT_FOUND) {
                                    logger.appendErrorToMessages('uploadAllFiles', 'File not found, but skipped because this can happen if the file was removed after the calculation of the operation list: ' + localPath.fsPath, ex);
                                    resolve();
                                    return;
                                }

                                logger.appendErrorToMessages('uploadAllFiles', 'Failed to upload from local path: ' + localPath.path, ex);
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
                                    await this.downloadRemoteFileToLocalIfNeeded(remotePath, false, 'heavy', false, token);
                                    fileDecorationManager.setUpToDateFileDecoration(remotePath);
                                    this.downloadedCount++;
                                    progress.report({
                                        message: '(' + this.downloadedCount + ' of ' + this.downloadCount + ') ' + remotePath.path,
                                        increment: this.downloadedProgress
                                    });
                                }

                                resolve();
                            } catch(ex: any) {
                                if (ex.code === ErrorCodes.FILE_NOT_FOUND) {
                                    logger.appendErrorToMessages('downloadAllFiles', 'File not found, but skipped because this can happen if the file was removed after the calculation of the operation list: ' + remotePath.fsPath + ', operation: ', ex);
                                    resolve();
                                    return;
                                }

                                logger.appendErrorToMessages('downloadAllFiles', 'Failed to download from remote path: ' + remotePath.path, ex);
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

    async uploadLocalFileToRemoteIfNeeded(remoteName: string, localUri: vscode.Uri, connectionType: PoolType, forceRemoteOverwrite: Boolean, parentToken: vscode.CancellationToken | undefined = undefined, beforePerformOperation?: () => void): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                if (parentToken !== undefined && parentToken.isCancellationRequested) {
                    reject(Error('Upload cancelled by user.'));
                    throw Error('Upload cancelled by user.');
                }

                const remoteUri = this.getRemoteFileUri(remoteName, localUri);

                // Check if file exists
                var remoteStat: vscode.FileStat | undefined = undefined;

                try {
                    remoteStat = await this.$stat(remoteUri, false, 'heavy');
                } catch(ex: any) {
                    if (ex instanceof vscode.FileSystemError) {
                        if (ex.code !== 'FileNotFound') {
                            logger.appendErrorToMessages('uploadLocalFileToRemoteIfNeeded', 'Something went wrong while getting stat of remote file: ' + localUri.path, ex);
                            reject(ex);
                            return;
                        }
                    } else {
                        reject(ex);
                        return;
                    }
                }
                const localStat = await this.statLocalFileByUri(localUri);

                if (localStat === undefined) {
                    // unexpected
                    reject(Error('Local file not found.'));
                    return;
                }

                if (remoteStat !== undefined) {
                    // Determine if the remote file is newer than ours.
                    const compare = await this.resolveWhatFileIsNewer(localStat, remoteStat);

                    if (compare === 'remote_newer' && !forceRemoteOverwrite) {
                        // To prevent an overwrite, skip this file as the remote is newer than ours file...
                        fileDecorationManager.setRemoteDownloadFileDecoration(remoteUri);
                        resolve();
                        return;
                    }
                }

                if (parentToken !== undefined && parentToken.isCancellationRequested) {
                    reject(Error('Upload cancelled by user.'));
                    throw Error('Upload cancelled by user.');
                }

                // Check if parent folder exists.
                const parentFolder = remoteUri.with({ path: upath.dirname(remoteUri.path) });
                
                const connectionProvider = await this.getConnection(remoteName, connectionType);
                const connection = connectionProvider?.getSFTP();
                if (connection === undefined) {
                    await this.releaseConnection(remoteName, connectionProvider);
                    reject(Error('Broken connection to SFTP server.'));
                    return;
                }

                if (beforePerformOperation !== undefined) {
                    beforePerformOperation();
                }

                if (parentToken !== undefined && parentToken.isCancellationRequested) {
                    reject(Error('Upload cancelled by user.'));
                    throw Error('Upload cancelled by user.');
                }

                try {
                    if (parentFolder.path !== '/') { // Check if parent folder is not the root folder
                        // Make folder if needed...
                        const exists = await new Promise<boolean>((resolve, reject) => {
                            connection.lstat(parentFolder.path, (err:any, stats) => {
                                if (err) {
                                    if (err.code === ErrorCodes.FILE_NOT_FOUND) {
                                        resolve(false);
                                    } else {
                                        reject(err);
                                    }
                                    return;
                                }

                                resolve(true);
                            });
                        });

                        if (!exists) {
                            // Folder not exists, try to make it recursively.
                            await this.mkdirRemoteRecursive(connection, parentFolder);
                        }
                    }
    
                    // Read local file content...
                    const filename = upath.basename(remoteUri.path);
                    const fileSize = localStat.size;
    
                    // Upload file...
                    // upload file to remote
                    fileDecorationManager.getStatusBarItem().text = '$(cloud-upload) ' + remoteUri.path;
                    const sizeKB = configuration.getBehaviorNotificationUploadKB();

                    if (fileSize > (1024) * sizeKB) {
                        await vscode.window.withProgress({
                            cancellable: true,
                            location: vscode.ProgressLocation.Notification,
                            title: 'Uploading ' + filename + '...'
                        }, (progress, token) => {
                            return new Promise<void>(async (resolveProgress, rejectProgress) => {
                                connection.fastPut(
                                    localUri.fsPath, 
                                    remoteUri.path,
                                    {
                                        fileSize: localStat.size,
                                        step(total, nb, fileSize) {
                                            if (token !== undefined && token.isCancellationRequested || parentToken !== undefined && parentToken.isCancellationRequested) {
                                                reject(Error('Upload cancelled by user.'));
                                                throw Error('Upload cancelled by user.');
                                            }
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
                    } else {
                        await new Promise<void>(async (resolveProgress, rejectProgress) => {
                            connection.fastPut(
                                localUri.fsPath, 
                                remoteUri.path,
                                {
                                    fileSize: localStat.size,
                                    step(total, nb, fileSize) {
                                        if (parentToken !== undefined && parentToken.isCancellationRequested) {
                                            reject(Error('Upload cancelled by user.'));
                                            throw Error('Upload cancelled by user.');
                                        }
                                        logger.appendLineToMessages('[upload-file ' + filename + '] Progress "' + total + '" of "' + fileSize + '" transferred.');
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
                    }

                    logger.appendLineToMessages('[upload-remote-file] Write completed, mtime must be updated for: ' + localUri.path);
                    connection.lstat(remoteUri.path, async (err: any, stats) => {
                        if (err) {
                            // No error expected at this point, but since we only need stats at this point to adjust the mtime of local file
                            // then we will simply discard this error and print in the logs.
                            logger.appendErrorToMessages('uploadLocalFileToRemoteIfNeeded', 'Something went wrong while updating mtime of local file: ', err);
                            this.releaseConnection(remoteName, connectionProvider);
                            this._fireSoon({ type: vscode.FileChangeType.Changed, uri: remoteUri });
                            resolve();
                            return;
                        }

                        const lock = this.addWatchLockFromLocalUri(localUri);

                        // Try to add this file to the cached directory if exists...
                        const filename = upath.basename(remoteUri.path);
                        this.getSystemProviderData(remoteName)!.addFileToCachedDirectory(parentFolder, filename, stats);

                        try {
                            fs.utimes(localUri.fsPath, stats.atime, stats.mtime, (err) => {
                                if (err) {
                                    // This error is not really important, so instead of fail the entire process only print this in the logs...
                                    logger.appendErrorToMessages('uploadLocalFileToRemoteIfNeeded', 'Something went wrong while updating mtime of local file: ', err);
                                }

                                this.releaseConnection(remoteName, connectionProvider);
                                this.removeWatchLock(lock);
                                this._fireSoon({ type: vscode.FileChangeType.Changed, uri: remoteUri });
                                resolve();
                            });
                            fileDecorationManager.setUpToDateFileDecoration(remoteUri);
                        } catch(ex: any) {
                            this.releaseConnection(remoteName, connectionProvider);
                            this.removeWatchLock(lock);
                            logger.appendErrorToMessages('uploadLocalFileToRemoteIfNeeded', 'Something went wrong: ', ex);
                            reject(ex);
                        }
                    });
                } finally {
                    this.releaseConnection(remoteName, connectionProvider);
                }
            } catch(ex: any) {
                reject(ex);
            }
        });
    }

    async downloadRemoteFileToLocalIfNeeded(uri: vscode.Uri, readFile: boolean, connectionType: PoolType, forceLocalDownload: boolean, parentToken: vscode.CancellationToken | undefined = undefined, beforePerformOperation?: () => void): Promise<Uint8Array | undefined> {
        const remoteName = this.getRemoteName(uri);
        return new Promise(async (resolve, reject) => {
            logger.appendLineToMessages('[read-file] ' + uri.path);

            const connectionProvider = await this.getConnection(remoteName, connectionType);
            const connection = connectionProvider?.getSFTP();
            if (connection === undefined) {
                await this.releaseConnection(remoteName, connectionProvider);
                reject(Error('Broken connection to SFTP server.'));
                return;
            }

            if (parentToken?.isCancellationRequested) {
                await this.releaseConnection(remoteName, connectionProvider);
                reject(Error('Operation cancelled by user.'));
                return;
            }
            
            if (beforePerformOperation !== undefined) {
                beforePerformOperation();
            }

            connection.lstat(uri.path, async(error: any, remoteStat) => {
                if (error) {
                    await this.releaseConnection(remoteName, connectionProvider);

                    if (error.code === ErrorCodes.FILE_NOT_FOUND && readFile) {
                        // May be a local file only...
                        const localUri = this.getLocalFileUri(remoteName, uri);
                        const localStats = this.statLocalFileByUri(localUri);
                        if (localStats !== undefined) {
                            // Local file found, read it and send in response...
                            resolve(
                                await vscode.workspace.fs.readFile(localUri)
                            );
                            return;
                        }
                    }

                    reject(error);
                    return;
                }

                if (parentToken?.isCancellationRequested) {
                    await this.releaseConnection(remoteName, connectionProvider);
                    reject(Error('Operation cancelled by user.'));
                    return;
                }

                const calculatedLocalFile = this.getLocalFileUri(remoteName, uri);

                try {
                    const fileType = this.getFileTypeByStats(remoteStat);

                    var realStats = remoteStat;
                    if (fileType === vscode.FileType.SymbolicLink) {
                        if (connection === undefined) {
                            await this.releaseConnection(remoteName, connectionProvider);
                            reject(Error('Broken connection to SFTP server.'));
                            return;
                        }

                        if (parentToken?.isCancellationRequested) {
                            await this.releaseConnection(remoteName, connectionProvider);
                            reject(Error('Operation cancelled by user.'));
                            return;
                        }

                        try {
                            realStats = await this.followSymbolicLinkAndGetStats(connection, uri);
                        } finally {
                            await this.releaseConnection(remoteName, connectionProvider);
                        }
                    }

                    // check if exists in local
                    const localFileStat = await this.statLocalFileByUri(calculatedLocalFile);

                    if (parentToken?.isCancellationRequested) {
                        reject(Error('Operation cancelled by user.'));
                        await this.releaseConnection(remoteName, connectionProvider);
                        return;
                    }

                    if (localFileStat !== undefined) {
                        const comparisonResult = await this.resolveWhatFileIsNewer(localFileStat, remoteStat);
                        if (comparisonResult === 'same' && !forceLocalDownload) {
                            logger.appendLineToMessages('[read-file] ' + uri.path + ' -> Local file exists and is the same as remote, using local file., rmtime: ' + (remoteStat.mtime * 1000) + ', ltime: ' + localFileStat.mtime);
                            
                            if (!readFile) {
                                resolve(undefined);
                                await this.releaseConnection(remoteName, connectionProvider);
                                return;
                            }

                            const res = await vscode.workspace.fs.readFile(calculatedLocalFile);
                            await this.releaseConnection(remoteName, connectionProvider);
                            resolve(res);

                            fileDecorationManager.setUpToDateFileDecoration(uri);

                            return;
                        } else if(comparisonResult === 'local_newer' && !forceLocalDownload) {
                            logger.appendLineToMessages('[read-file] ' + uri.path + ' -> Local file exists and is newer than remote, rmtime: ' + (remoteStat.mtime * 1000) + ', ltime: ' + localFileStat.mtime);
                            
                            if (!readFile) {
                                await this.releaseConnection(remoteName, connectionProvider);
                                resolve(undefined);
                                return;
                            }
                            
                            const res = await vscode.workspace.fs.readFile(calculatedLocalFile);
                            await this.releaseConnection(remoteName, connectionProvider);
                            resolve(res);

                            fileDecorationManager.setLocalUploadFileDecoration(uri);

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
                        await this.releaseConnection(remoteName, connectionProvider);
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
                    const sizeKB = configuration.getBehaviorNotificationDownloadKB();

                    if (fileSize > (1024) * sizeKB) {
                        // More than 1mb, do in progressive notification.
                        res = await vscode.window.withProgress({
                            cancellable: true,
                            location: vscode.ProgressLocation.Notification,
                            title: 'Downloading ' + filename + '...'
                        }, (progress, token) => {
                            return new Promise<Uint8Array| undefined>(async (resolveProgress, rejectProgress) => {
                                try {
                                    if (connection === undefined) {
                                        await this.releaseConnection(remoteName, connectionProvider);
                                        reject(Error('Broken connection to SFTP server.'));
                                        return;
                                    }

                                    if (parentToken?.isCancellationRequested || token.isCancellationRequested) {
                                        await this.releaseConnection(remoteName, connectionProvider);
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
                                    await this.releaseConnection(remoteName, connectionProvider);
                                    resolveProgress(res);
                                } catch(ex: any) {
                                    await this.releaseConnection(remoteName, connectionProvider);
                                    rejectProgress(ex);
                                }
                            });
                        });
                    } else {
                        if (connection === undefined) {
                            await this.releaseConnection(remoteName, connectionProvider);
                            reject(Error('Broken connection to SFTP server.'));
                            return;
                        }

                        if (parentToken?.isCancellationRequested) {
                            await this.releaseConnection(remoteName, connectionProvider);
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
                            await this.releaseConnection(remoteName, connectionProvider);
                        }
                    }

                    // Adjust mtime for local
                    const localPath = this.getLocalFileUri(remoteName, uri);
                    await new Promise<void>((resolve) => {
                        connection.lstat(uri.path, (err, stats) => {
                            if (err) {
                                // This error is not really important, so instead of fail the entire process only print this in the logs...
                                logger.appendErrorToMessages('downloadRemoteFileToLocalIfNeeded', 'Something went wrong while reading lstat of remote: ' + uri.path, err);
                                resolve();
                                return err;
                            }

                            fs.utimes(localPath.fsPath, stats.atime, stats.mtime, (err) => {
                                if (err) {
                                    // This error is not really important, so instead of fail the entire process only print this in the logs...
                                    logger.appendErrorToMessages('downloadRemoteFileToLocalIfNeeded', 'Something went wrong while updating mtime of local file: ' + localPath.fsPath, err);
                                }
                                resolve();
                            });
                        });
                    });

                    fileDecorationManager.setUpToDateFileDecoration(uri);
                    logger.appendLineToMessages('[download-file] Completed for: ' + filename);
                    await this.releaseConnection(remoteName, connectionProvider);
                    resolve(res);
                } catch(ex: any) {
                    await this.releaseConnection(remoteName, connectionProvider);
                    
                    // Remove local file at it may be in an invalid state...
                    await vscode.workspace.fs.delete(calculatedLocalFile, { recursive: true, useTrash: false });
                    fileDecorationManager.setRemoteFileDecoration(uri);

                    logger.appendLineToMessages('Cannot read file (' + remoteName + '): ' + ex.message);
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
            const remoteName = this.getRemoteName(uri);
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
                            logger.appendLineToMessages('Cannot read file (' + remoteName + '): ' + ex.message);
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

    async getConnection(remoteName: string, type: PoolType) {
        logger.appendLineToMessages('[connection] Trying to acquire "' + type + '" connection.');
        return (await (await connectionManager.get(remoteName)?.getPool(type))?.acquire());
    }

    async releaseConnection(remoteName: string, connection: ConnectionProvider | undefined) {
        try {
            if (connection === undefined) {
                return;
            }

            logger.appendLineToMessages('[connection] Releasing "' + connection.type + '" connection.');
            
            (await connectionManager.get(remoteName)?.getPool(connection.type))?.release(connection);

            logger.appendLineToMessages('[connection] Connection "' + connection.type + '" released.');
        } catch(ex: any) {
            logger.appendErrorToMessages('releaseConnection', 'Error releasing connection:', ex);
            // Do nothing...
        }
    }

    getLocalFileUri(remoteName: string, uri: vscode.Uri) {
        const workDirPath = this.getSystemProviderData(remoteName)!.workDirPath;
        return workDirPath.with({ path: upath.join(workDirPath.fsPath, uri.path) });
    }

    getRemoteFileUri(remoteName: string, uri: vscode.Uri): vscode.Uri {
        const workDirPath = this.getSystemProviderData(remoteName)!.workDirPath;
        const workdirPathLowercase = workDirPath.path.toLowerCase();
        const pathLowerCase = uri.path.toLowerCase();

        var basePath = uri.path;
        if (pathLowerCase.includes(workdirPathLowercase)) {
            basePath = uri.path.substring(workdirPathLowercase.length, uri.path.length);
        }
        
        return uri.with({
            scheme: 'sftp',
            authority: remoteName,
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
        this.sftpFileProvidersDataByRemotes.forEach((entry) => {
            entry.workDirWatcher.dispose();
        });
        clearInterval(this.watchLocksCleanupTask);
    }

    async removeLocalFile(remoteName: string, uri: vscode.Uri, token: vscode.CancellationToken) {
        const localPath = this.getLocalFileUri(remoteName, uri);

        const stat = await this.statLocalFileByUri(localPath);
        if (stat === undefined) {
            vscode.window.showInformationMessage('There is not a local version of this file.');
            return;
        }

        const urisToUpdate: vscode.Uri[] = [];
        (await this.listLocalAndGetUris(remoteName, localPath, token)).forEach((u) => urisToUpdate.push(u));

        if (token.isCancellationRequested) {
            throw Error('Remove local file: Operation cancelled.');
        }

        //TODO: Make it cancellable...
        await vscode.workspace.fs.delete(localPath, { recursive: true, useTrash: true });

        for (const uri of urisToUpdate) {
            fileDecorationManager.setRemoteFileDecoration(uri);
        }
    }

    private async listLocalAndGetUris(remoteName: string, uri: vscode.Uri, token: vscode.CancellationToken) {
        const res: vscode.Uri[] = [];
        const stat = await this.statLocalFileByUri(uri);

        if (token.isCancellationRequested) {
            throw Error('Remove local file: Operation cancelled.');
        }

        res.push(this.getRemoteFileUri(remoteName, uri));
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
                    res.push(this.getRemoteFileUri(remoteName, fileUri));
                    if (fileEntry[1] === vscode.FileType.Directory) {
                        const recursive = await this.listLocalAndGetUris(remoteName, fileUri, token);
                        recursive.forEach((u) => {
                            res.push(u);
                        });
                    }
                }
            }
        }

        return res;
    }

    sendUpdateForRootFolder() {
        setTimeout(async () => {
            await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
        }, 1500);
    }

    async mkdirRemoteRecursive(sftp: SFTPWrapper, uri: vscode.Uri) {
        const targetPath = uri.path;
        const parts = targetPath.split('/');
        let currentPath = '';
    
        for (const part of parts) {
            if (!part) {
                continue; // Skip empty parts (like the leading '/')
            }
    
            currentPath += `/${part}`;
    
            // Check if the directory exists, and if not, create it
            const exists = await new Promise((resolve, reject) => {
                sftp.stat(currentPath, (err: any) => {
                    if (err && err.code === 2) { // Directory does not exist
                        resolve(false);
                    } else if (err) {
                        reject(err); // Other errors
                    } else {
                        resolve(true); // Directory exists
                    }
                });
            });
    
            if (!exists) {
                // Directory doesn't exist, so we need to create it
                await new Promise<void>((resolve, reject) => {
                    sftp.mkdir(currentPath, (err: any) => {
                        if (err) {
                            if (err.code === ErrorCodes.FILE_EXISTS) {
                                // Can happen when doing operations in parallel.
                                resolve();
                                return;
                            }
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        }
    }

    shouldCacheDirectory(uri: vscode.Uri): boolean {
        const existingValue = this.requestedDirectoriesThreshold.get(uri.toString());
        if (existingValue === undefined) {
            this.requestedDirectoriesThreshold.set(uri.toString(), {
                requestedTimes: 1,
                timestamp: Date.now()
            });
            return false;
        }

        existingValue.timestamp = Date.now();
        existingValue.requestedTimes++;

        return existingValue.requestedTimes > 5;
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

export type SyncOperationType = 'DOWNLOAD_REMOTE' | 'UPLOAD_LOCAL' | 'NOTHING'

export class SFTPFileProviderData {
    remoteName!: string;
    remoteConfiguration!: RemoteConfiguration;
    workDirPath!: vscode.Uri;
    workDirWatcher!: vscode.FileSystemWatcher;
    isVCFocused = false;
    setupDone = false;
    cachedStatDirectories: Map<string, CachedStatDirectory> = new Map();

    getCachedStatDirectory(uri: vscode.Uri) {
        if (this.cachedStatDirectories.has(uri.fsPath)) {
            return this.cachedStatDirectories.get(uri.fsPath);
        }

        return undefined;
    }

    addCachedStatDirectory(uri: vscode.Uri, files: FileEntryWithStats[]) {
        console.log('[stat] Added to cache: ' + uri.path);
        this.cachedStatDirectories.set(uri.fsPath, {
            timestamp: Date.now(),
            files
        });
    }

    addFileToCachedDirectory(directoryUri: vscode.Uri, filename: string, stats: Stats) {
        const cached = this.getCachedStatDirectory(directoryUri);
        if (cached !== undefined) {
            const newFileList = cached.files.filter((f) => f.filename !== filename);
            newFileList.push({
                filename,
                longname: filename,
                attrs: stats
            });
            cached.files = newFileList;
        }
    }

    removeFileFromCachedFolder(directoryUri: vscode.Uri, filename: string) {
        const cached = this.getCachedStatDirectory(directoryUri);
        if (cached !== undefined) {
            const newFileList = cached.files.filter((f) => f.filename !== filename);
            cached.files = newFileList;
        }
    }

    cleanCachedDirectories() {
        const toRemove: string[] = [];
        for (const entry of this.cachedStatDirectories) {
            const key = entry[0];
            const cache = entry[1];

            // Keep cached entry for 30s
            if (Date.now() - cache.timestamp >= (configuration.getCacheMetadataTimeToKeep() * 1000)) {
                logger.appendLineToMessages('[cache] Removed entry for directory: ' + key);
                toRemove.push(key);
            }
        }

        for (const key of toRemove) {
            this.cachedStatDirectories.delete(key);
        }
    }
}

export interface CachedStatDirectory {
    timestamp: number
    files: FileEntryWithStats[]
}

export interface RequestedDirectoryThreshold {
    requestedTimes: number
    timestamp: number
}
