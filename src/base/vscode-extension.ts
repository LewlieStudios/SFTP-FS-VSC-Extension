import { SFTPFileSystem } from '../sftp/sftp-file-system.js';
import { QuickPickItemWithValue } from '../models/quick-pick.model.js';
import * as vscode from 'vscode';
import { Configuration } from './configuration.js';
import { Logger } from './logger.js';
import { AddRemoteCommand } from '../commands/add-remote.command.js';
import { ConnectionManager } from '../sftp/connection-manager.js';
import { FileDecorationManager as SFTPFileDecoration } from '../sftp/file-decoration-manager.js';
import { EditRemoteCommand } from '../commands/edit-remote.command.js';
import { RemoveRemoteCommand } from '../commands/remove-remote.command.js';
import { ConnectRemoteCommand } from '../commands/connect-remote.command.js';
import { ShowSystemExplorerCommand } from '../commands/show-system-explorer.command.js';
import { RemoveLocalFileCommand } from '../commands/remove-local-file.command.js';
import { UploadLocalFolderCommand } from '../commands/upload-local-folder.command.js';
import { DownloadRemoteFolderCommand } from '../commands/download-remote-folder.command.js';
import { RefreshRemoteFolderCommand } from '../commands/refresh-remote-folder.command.js';
import { ReconnectCommand } from '../commands/reconnect.command.js';
import { DisconnectDirectRemoteCommand } from '../commands/disconnect-direct-remote.command.js';
import { BulkFileUploadCommand } from '../commands/bulk-file-upload.command.js';
import { DownloadRemoteFileCommand } from '../commands/download-remote-file.command.js';
import { UploadLocalFileCommand } from '../commands/upload-local-file.command.js';
import { RefreshDirectoryCommand } from '../commands/refresh-directory.command.js';

export class SFTPExtension {

 	logger!: Logger;
	configuration!: Configuration;
	connectionManager!: ConnectionManager;
	sftpFileSystem!: SFTPFileSystem;
	sftpFileDecoration!: SFTPFileDecoration;

	vscodeStatusBarItem!: vscode.StatusBarItem;
	vscodeRemoteConnectQuickPick?: vscode.QuickPick<QuickPickItemWithValue> = undefined;

	constructor(public context: vscode.ExtensionContext) {}

	/**
	 * Function for extension activation.
	 */
	async activate() {
		this.configuration = new Configuration();
		this.logger = new Logger();
		this.connectionManager = new ConnectionManager(this);
		this.sftpFileDecoration = new SFTPFileDecoration();

		console.log('Extension activated');
		this.logger.init();
		
		this.registerSFTPFileSystem();
		this.createStatusBarItem();
		this.registerCommands();
		
		this.context.subscriptions.push(
			vscode.window.registerFileDecorationProvider(this.sftpFileDecoration)
		);
	}
	
	async deactivate() {
		console.log('Extension deactivated');
		await this.connectionManager.destroyAll();
		
		const provider = this.sftpFileSystem;
		console.log('Disposing file system provider...');
		provider?.dispose();
	}

	/**
	 * Register the SFTP file system provider.
	 * @param context The extension context.
	 */
	registerSFTPFileSystem() {
		this.sftpFileSystem = new SFTPFileSystem(this);
		this.context.subscriptions.push(
			vscode.workspace.registerFileSystemProvider(
				'sftp', 
				this.sftpFileSystem, 
				{ 
					isCaseSensitive: true
				}
			)
		);
	}

	/**
	 * Create the status bar item for the extension.
	 * @param context The extension context.
	 */
	createStatusBarItem() {
		this.vscodeStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		this.vscodeStatusBarItem.text = '$(cloud) Ready';
		this.vscodeStatusBarItem.tooltip = 'SFTP status';
		this.vscodeStatusBarItem.show();
		this.context.subscriptions.push(this.vscodeStatusBarItem);
	}

	registerCommands() {
		new AddRemoteCommand(this, 'sftpfs.addRemote').register();
		new EditRemoteCommand(this, 'sftpfs.editRemote').register();
		new RemoveRemoteCommand(this, 'sftpfs.removeRemote').register();
		new ConnectRemoteCommand(this, 'sftpfs.connectRemote').register();
		new ShowSystemExplorerCommand(this, 'sftpfs.showInSystemExplorer').register();
		new RemoveLocalFileCommand(this, 'sftpfs.removeLocalFile').register();
		new UploadLocalFolderCommand(this, 'sftpfs.uploadLocalFolder').register();
		new DownloadRemoteFolderCommand(this, 'sftpfs.downloadRemoteFolder').register();
		new RefreshRemoteFolderCommand(this, 'sftpfs.refreshRemoteFolder').register();
		new ReconnectCommand(this, 'sftpfs.reconnect').register();
		new DisconnectDirectRemoteCommand(this, 'sftpfs.disconnectDirectRemote').register();
		new BulkFileUploadCommand(this, 'sftpfs.bulkFileUpload').register();
		new DownloadRemoteFileCommand(this, 'sftpfs.downloadRemoteFile').register();
		new UploadLocalFileCommand(this, 'sftpfs.uploadLocalFile').register();
		new RefreshDirectoryCommand(this, 'sftpfs.refreshDirectory').register();
	}
}
