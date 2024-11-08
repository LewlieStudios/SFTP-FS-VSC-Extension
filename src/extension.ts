// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import logger from './logger.js';
import configuration from './configuration.js';
import connectionManager from './connection-manager.js';
import { SFTPFileSystemProvider } from './sftp-file-system.js';
import upath from 'upath';
import fileDecorationManager from './file-decoration-manager.js';
import os from 'os';

const getOpen = async () => import('open');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension activated');
	logger.init();

	const provider = new SFTPFileSystemProvider();
	context.subscriptions.push(
			vscode.workspace.registerFileSystemProvider(
				'sftp', 
				provider, 
				{ 
					isCaseSensitive: true
				}
			)
	);

	const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	item.text = '$(cloud) Ready';
	item.tooltip = 'SFTP status';
	item.show();

	fileDecorationManager.setStatusBarItem(item);
	
	context.subscriptions.push(item);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(
		vscode.commands.registerCommand('sftpfs.addRemote', () => {
			vscode.window.showInputBox({
				prompt: 'Enter a host...',
				validateInput: (value) => {
					if (value.trim().length === 0) {
						return {
							message: 'Host should not be empty.',
							severity: vscode.InputBoxValidationSeverity.Error
						} as vscode.InputBoxValidationMessage;
					}
				}
			}).then((host) => {
				if (!host) {
					return;
				}

				vscode.window.showInputBox({
					prompt: 'Enter port number...',
					validateInput: (value) => {
						if (!/^[0-9]+$/.test(value)) {
							return {
								message: 'Number not valid',
								severity: vscode.InputBoxValidationSeverity.Error
							} as vscode.InputBoxValidationMessage;
						}
					}
				}).then((port) => {
					if (!port) {
						return;
					}

					vscode.window.showInputBox({
						prompt: 'Enter username...',
						validateInput: (value) => {
							if (value.trim().length === 0) {
								return {
									message: 'Username should not be empty.',
									severity: vscode.InputBoxValidationSeverity.Error
								} as vscode.InputBoxValidationMessage;
							}
						}
					}).then((username) => {
						if (!username) {
							return;
						}

						vscode.window.showInputBox({
							prompt: 'Enter password...',
							placeHolder: 'Leave empty to not use password',
							password: true
						}).then((password) => {
							vscode.window.showInputBox({
								prompt: 'Enter remote path to work...',
								placeHolder: 'Leave empty to set /'
							}).then((remotePath) => {
								vscode.window.showInputBox({
									prompt: 'Enter a name to use for this remote configuration (should be unique)',
									validateInput: async (value) => {
										if (value.trim().length === 0) {
											return {
												message: 'Name should not be empty.',
												severity: vscode.InputBoxValidationSeverity.Error
											} as vscode.InputBoxValidationMessage;
										}

										const currentNames = await configuration.getRemotesConfigurationNames();
										for (const name of currentNames) {
											if (name.trim().toLowerCase() === value.trim().toLowerCase()) {
												return {
													message: 'This name is already in use by another remote.',
													severity: vscode.InputBoxValidationSeverity.Error
												} as vscode.InputBoxValidationMessage;
											}
										}
									}
								}).then(async (name) => {
									if (!name) {
										return;
									}

									// Save configuration...
									configuration.saveRemoteConfiguration(
										name,
										host,
										parseInt(port),
										username,
										remotePath ?? '/',
										password,
									)
									.then(() => {
										vscode.window.showInformationMessage('Remote "' + name + "' added.", "Open configuration").then((res) => {
											if (res === "Open configuration") {
												vscode.commands.executeCommand('workbench.action.openSettings', '@ext:lewlie.sftpfs');
											}
										});
									})
									.catch((ex) => {
										vscode.window.showErrorMessage('Something went wrong...');
										logger.appendErrorToMessages('sftpfs.addRemote', 'Unable to save remote configuration.', ex);
									});
								});
							});
						});
					});
				});
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('sftpfs.removeRemote', async () => {
			const names = await configuration.getRemotesConfigurationNames();

			if (names.length === 0) {
				vscode.window.showInformationMessage('Currently there is not any remote configured.', 'Add Remote').then((res) => {
					if (res === 'Add Remote') {
						vscode.commands.executeCommand('sftpfs.addRemote');
					}
				});
				return;
			}

			vscode.window.showQuickPick(
				names,
				{
					placeHolder: 'Select a remote to remove...',
					canPickMany: true
				}
			).then(async (selections) => {
				if (selections) {
					// Remove remote configuration
					configuration.removeRemoteConfiguration(selections).then(() => {
						for (const selection of selections) {
							vscode.window.showInformationMessage('Remote "' + selection + '" removed.');
						}
					}).catch((ex) => {
						vscode.window.showErrorMessage('Something went wrong...');
						logger.appendErrorToMessages('sftpfs.removeRemote', 'Unable to delete remote configuration.', ex);
					});
				}
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('sftpfs.connectRemote', async () => {
			const names = await configuration.getRemotesConfigurationNames();

			if (names.length === 0) {
				vscode.window.showInformationMessage('Currently there is not any remote configured.', 'Add Remote').then((res) => {
					if (res === 'Add Remote') {
						vscode.commands.executeCommand('sftpfs.addRemote');
					}
				});
				return;
			}

			vscode.window.showQuickPick(
				names,
				{
					placeHolder: 'Select a remote to connect...'
				}
			).then(async (remoteName) => {
				if (remoteName) {
					const config = await configuration.getRemoteConfiguration(remoteName);
					if (config === undefined) {
						logger.appendLineToMessages('Unexpected, configuration for remote "' + remoteName + '" is undefined.');
						vscode.window.showErrorMessage('Failed to get configuration for remote "' + remoteName + '".');
						return;
					}

					// ALready open?
					if (vscode.workspace.workspaceFolders !== undefined) {
						for (const workspaceDir of vscode.workspace.workspaceFolders) {
							if (workspaceDir.uri.scheme === 'sftp' && workspaceDir.uri.authority.toLowerCase() === remoteName.toLowerCase()) {
								vscode.window.showErrorMessage('This remote is already open.');
								return;
							}
						}
					}

					var workDir = await configuration.getWorkDirForRemote(remoteName);

					if (workDir === undefined) {
						await vscode.window.showInformationMessage(
							'You have not configured a local folder to synchronize files from this remote, please select a folder.',
							{
								modal: true
							}
						);

						const dir = await vscode.window.showOpenDialog({
							canSelectFiles: false,
							canSelectFolders: true,
							canSelectMany: false,
							title: 'Select a folder to sync remote files',
							openLabel: 'Select',
							defaultUri: vscode.Uri.file(upath.join(os.homedir()))
						});
						if (dir === undefined || dir.length === 0) {
							return;
						}

						const dirPath = dir[0];
						try {
							const stats = await vscode.workspace.fs.stat(dirPath);
							if (stats.type !== vscode.FileType.Directory) {
								logger.appendLineToMessages('Expected a directory but file found at: ' + dirPath.path);
								vscode.window.showErrorMessage('File "' + dir + '" exists but it is not a directory, it is a file and can\'t be used as workdir.');
								return;
							}
							logger.appendLineToMessages('Directory exists: ' + dirPath.path);
						} catch(ex: any) {
							if (ex instanceof vscode.FileSystemError && ex.code === 'FileNotFound') {
								logger.appendLineToMessages('Directory not exists, creating: ' + dirPath.path);
								try {
									await vscode.workspace.fs.createDirectory(dirPath);
									logger.appendLineToMessages('Directory created.');
								} catch(ex: any) {
									logger.appendErrorToMessages('sftpfs.connectRemote', 'Error making directory: ' + dirPath.path, ex);
									vscode.window.showErrorMessage('Failed to initialize workdir.');
									return;
								}
							} else {
								logger.appendErrorToMessages('sftpfs.connectRemote', 'Failed to stat directory: ' + dirPath.path, ex);
								vscode.window.showErrorMessage('Failed to initialize workdir.');
								return;
							}
						}
						
						workDir = dirPath.path;

						try {
							await configuration.setWorkDirForRemote(remoteName, workDir);
						} catch(ex: any) {
							logger.appendErrorToMessages('sftpfs.connectRemote', 'Failed to save workspace configuration for remote name "' + remoteName + '", path to save: ' + dirPath.path, ex);
								vscode.window.showErrorMessage('Failed to initialize workdir.');
								return;
						}
						logger.appendLineToMessages('Using workdir for remote connection "' + remoteName + '": ' + workDir);
					} else {
						logger.appendLineToMessages('Workdir loaded for remote connection "' + remoteName + '": ' + workDir);

						const dirPath = vscode.Uri.file(workDir);
						try {
							const stats = await vscode.workspace.fs.stat(dirPath);
							if (stats.type !== vscode.FileType.Directory) {
								logger.appendLineToMessages('Expected a directory but file found at: ' + dirPath.path);
								vscode.window.showErrorMessage('File "' + dirPath.path + '" exists but it is not a directory, it is a file and can\'t be used as workdir.');
								return;
							}
							logger.appendLineToMessages('Directory exists: ' + dirPath.path);
						} catch(ex: any) {
							if (ex instanceof vscode.FileSystemError && ex.code === 'FileNotFound') {
								logger.appendLineToMessages('Directory not exists, creating: ' + dirPath.path);
								try {
									await vscode.workspace.fs.createDirectory(dirPath);
									logger.appendLineToMessages('Directory created.');
								} catch(ex: any) {
									logger.appendErrorToMessages('sftpfs.connectRemote', 'Error making directory: ' + dirPath.path, ex);
									vscode.window.showErrorMessage('Failed to initialize workdir.');
									return;
								}
							} else {
								logger.appendErrorToMessages('sftpfs.connectRemote', 'Failed to stat directory: ' + dirPath.path, ex);
								vscode.window.showErrorMessage('Failed to initialize workdir.');
								return;
							}
						}
					}

					if(!connectionManager.poolExists(remoteName)) {
						console.log('Creating connection pool!');
						await connectionManager.createPool({
							configuration: config,
							remoteName: remoteName
						});
					}

					vscode.window.withProgress(
						{
							location: vscode.ProgressLocation.Notification, // Location of the progress indicator
							title: 'Connecting to SFTP (' + config.host + ':' + config.port + ' at ' + (config.remotePath ?? '/') + ') ...', // Title of the progress notification
							cancellable: false, // Allow cancellation
						},
						async () => {
							const connection = await (await connectionManager.get(remoteName)?.getPool('passive'))?.acquire();
							if (connection === undefined) {
								throw Error('SFTP Connection lost.');
							}
							// If connection is success, add workspace to project...
							const removeLeadingSlash = (config.remotePath ?? '/').replace(/^\/+/, '');
							const virtualFolderUri = vscode.Uri.parse('sftp://' + remoteName + '/' + removeLeadingSlash);
							console.warn(virtualFolderUri);
							vscode.workspace.updateWorkspaceFolders(
									vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0,
									null,
									{ 
										uri: virtualFolderUri, 
										name: "SFTP - " + remoteName + " - " + (config.remotePath ?? '/')
									}
							);
						}
					);
				}
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('sftpfs.showInSystemExplorer', async (uri: vscode.Uri) => {
			try {
				logger.appendLineToMessages("Show in system explorer for file, scheme=" + uri.scheme + ", authority=" + uri.authority + ", path=" + uri.path);

				const provider = SFTPFileSystemProvider.instance;
				if (provider === undefined) {
					logger.appendLineToMessages('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
					vscode.window.showErrorMessage('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
					return;
				}

				var statFile = await provider.stat(uri);

				const remoteName = provider.getRemoteName(uri);
				const workDirPath = provider.getSystemProviderData(remoteName)!.workDirPath;
				const calculatedLocalFile = workDirPath.with({ path: upath.join(workDirPath.fsPath, uri.path) });

				if (statFile.type === vscode.FileType.Directory) {
					// is a directory, so at least we should make the directory local.
					const localFileStats = await provider.statLocalFileByUri(calculatedLocalFile);
					if (localFileStats === undefined) {
						// local file not exists!
						logger.appendLineToMessages('Making folder... ' + calculatedLocalFile.fsPath);
						await vscode.workspace.fs.createDirectory(calculatedLocalFile);
					}

					// open...
					logger.appendLineToMessages('Opening folder... ' + calculatedLocalFile.fsPath);
					await provider.openLocalFolderInExplorer(calculatedLocalFile);
				} else {
					if (statFile.type === vscode.FileType.SymbolicLink) {
						uri = await provider.followSymbolicLinkAndGetRealPath(uri);
					}

					// Download if needed
					logger.appendLineToMessages('Downloading file... ' + uri.path);
					await provider.downloadRemoteFileToLocalIfNeeded(uri, false, 'passive');

					const directoryLocalPath = provider.getDirectoryPath(calculatedLocalFile);
					logger.appendLineToMessages('Opening folder... ' + directoryLocalPath.fsPath);
					await provider.openLocalFolderInExplorer(directoryLocalPath);
				}
			} catch(ex: any) {
				logger.appendErrorToMessages('sftpfs.showInSystemExplorer', 'Error', ex);
				vscode.window.showErrorMessage(ex.message);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('sftpfs.removeLocalFile', async (uri: vscode.Uri) => {
			try {
				const provider = SFTPFileSystemProvider.instance;
				if (provider === undefined) {
					logger.appendLineToMessages('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
					vscode.window.showErrorMessage('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
					return;
				}

				await vscode.window.withProgress({
					cancellable: true,
					location: vscode.ProgressLocation.Notification,
					title: 'Deleting files...'
				}, async (progress, token) => {
					await provider.removeLocalFile(provider.getRemoteName(uri), uri, token);
					await closeEditorByUri(uri);
				});
				
				vscode.window.showInformationMessage('Local version of file "' + upath.basename(uri.path) + '" removed.');

				// Send a refresh for the explorer
				provider.sendUpdateForRootFolder();
			} catch(ex: any) {
				logger.appendErrorToMessages('sftpfs.removeLocalFile', 'Failed due error:', ex);
				vscode.window.showErrorMessage('Operation failed: ' + ex.message);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('sftpfs.uploadLocalFolder', async (uri: vscode.Uri) => {
			try {
				const provider = SFTPFileSystemProvider.instance;
				if (provider === undefined) {
					logger.appendLineToMessages('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
					vscode.window.showErrorMessage('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
					return;
				}

				await vscode.window.withProgress({
					cancellable: true,
					location: vscode.ProgressLocation.Notification,
					title: 'Uploading files...'
				}, async (progress, token) => {
					await provider.uploadRemoteFolderFromLocal(uri, progress, token);
				});
				
				item.text = '$(cloud) Ready';
				vscode.window.showInformationMessage('Upload for "' + upath.basename(uri.path) + '" completed.');
			} catch(ex: any) {
				item.text = '$(cloud) Ready';
				logger.appendErrorToMessages('sftpfs.uploadLocalFolder', 'Failed due error:', ex);
				vscode.window.showErrorMessage('Operation failed: ' + ex.message);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('sftpfs.downloadRemoteFolder', async (uri: vscode.Uri) => {
			try {
				const provider = SFTPFileSystemProvider.instance;
				if (provider === undefined) {
					logger.appendLineToMessages('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
					vscode.window.showErrorMessage('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
					return;
				}

				await vscode.window.withProgress({
					cancellable: true,
					location: vscode.ProgressLocation.Notification,
					title: 'Downloading files...'
				}, async (progress, token) => {
					await provider.downloadRemoteFolderToLocal(uri, progress, token);
				});
				
				item.text = '$(cloud) Ready';
				vscode.window.showInformationMessage('Download for "' + upath.basename(uri.path) + '" completed.');
			} catch(ex: any) {
				item.text = '$(cloud) Ready';
				logger.appendErrorToMessages('sftpfs.downloadRemoteFolder', 'Failed due error:', ex);
				vscode.window.showErrorMessage('Operation failed: ' + ex.message);
			}
		})
	);

	
	context.subscriptions.push(
		vscode.commands.registerCommand('sftpfs.refreshRemoteFolder', async (uri: vscode.Uri) => {
			// Resync in both directions
			try {
				const provider = SFTPFileSystemProvider.instance;
				if (provider === undefined) {
					logger.appendLineToMessages('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
					vscode.window.showErrorMessage('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
					return;
				}

				await vscode.window.withProgress({
					cancellable: true,
					location: vscode.ProgressLocation.Notification,
					title: 'Syncing files...'
				}, async (progress, token) => {
					await provider.syncRemoteFolderWithLocal(uri, progress, token);
				});
				
				item.text = '$(cloud) Ready';
				vscode.window.showInformationMessage('Syncing files for "' + upath.basename(uri.path) + '" completed.');
			} catch(ex: any) {
				item.text = '$(cloud) Ready';
				logger.appendErrorToMessages('sftpfs.refreshRemoteFolder', 'Failed due error:', ex);
				vscode.window.showErrorMessage('Operation failed: ' + ex.message);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('sftpfs.reconnect', async () => {
			const response = await vscode.window.showInformationMessage(
				'Are you sure to reconnect? All current operation will be interrupted and files can be corrupted, it is recommended to cancel current running operations before doing a reconnect.',
				{
					modal: true
				},
				'Yes',
				'No'
			);

			if (response === 'No' || response === undefined) {
				return;
			}

			// Ok, attempt a reconnection.
			await connectionManager.reconnect();

			if (vscode.workspace.workspaceFolders !== undefined) {
				for (const workspace of vscode.workspace.workspaceFolders) {
					if (workspace.uri.scheme === 'sftp') {
						const provider = SFTPFileSystemProvider.instance;
						if (provider !== undefined) {
							provider.sendUpdateForRootFolder();
						}
					}
				}
			}

		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('sftpfs.disconnectDirectRemote', async (uri: vscode.Uri) => {
			try {
				const remoteName = uri.authority;

				const response = await vscode.window.showInformationMessage(
					'Are you sure to disconnect? All current operation will be interrupted and files can be corrupted, it is recommended to cancel current running operations before disconnect from server.',
					{
						modal: true
					},
					'Yes',
					'No'
				);

				if (response === 'No' || response === undefined) {
					return;
				}

				// Ok, attempt a disconnect.
				await connectionManager.get(remoteName)?.close();

				// Close workspace
				if (vscode.workspace.workspaceFolders !== undefined) {
					var index = -1;
					var found = false;
					for (const workspace of vscode.workspace.workspaceFolders) {
						index++;
						if (workspace.uri.toString() === uri.toString()) {
							found = true;
							break;
						}
					}
					if (found) {
						const provider = SFTPFileSystemProvider.instance;
						if (provider !== undefined) {
							await provider.dispose();
						}

						console.info('Closing workspace at ' + index);
						await vscode.commands.executeCommand('workbench.action.closeAllEditors');
						setTimeout(() => {
							vscode.workspace.updateWorkspaceFolders(index, 1);
						}, 100);
					}
				}
			} catch(ex: any) {
				logger.appendErrorToMessages('sftpfs.disconnectDirectRemote', 'Error closing project:', ex);
				vscode.window.showErrorMessage(ex.message);
			}
		})
	);

	context.subscriptions.push(
		vscode.window.registerFileDecorationProvider(fileDecorationManager)
	);

	context.subscriptions.push(
    vscode.commands.registerCommand('sftpfs.bulkFileUpload', (uri: vscode.Uri) => {
      const panel = vscode.window.createWebviewPanel(
        'sftpFsBulkFileUpload',
        'Bulk File Upload',
        vscode.ViewColumn.One,
        {
          enableScripts: true, // Allow JavaScript in the webview
					retainContextWhenHidden: true
        }
      );

      const bootstrapMinJs = vscode.Uri.joinPath(context.extensionUri, 'webview', 'bootstrap.bundle.min.js');
      const bootstrapMinCss = vscode.Uri.joinPath(context.extensionUri, 'webview', 'bootstrap.min.css');

      const bootstrapMinJsUri = panel.webview.asWebviewUri(bootstrapMinJs);
      const bootstrapMinCssUri = panel.webview.asWebviewUri(bootstrapMinCss);
      panel.webview.html = getWebviewContent(uri, bootstrapMinJsUri, bootstrapMinCssUri);

			var files: FileUploadRequest[] = [];
			var previousTask: NodeJS.Timeout | undefined = undefined;
			var previousTaskTime = 0;

			const refreshList = () => {
				clearTimeout(previousTask);

				const doAction = () => {
					const filesWithoutContent = files.map((f) => {
						return {
							...f,
							content: ''
						} as FileUploadRequest;
					}).sort((a, b) => a.name.localeCompare(b.name));
					panel.webview.postMessage({
						command: 'displayFiles',
						files: filesWithoutContent
					});
				};

				if (Date.now() - previousTaskTime > 100) {
					doAction();
					previousTaskTime = Date.now();
				} else {
					previousTask = setTimeout(() => {
						doAction();
					}, 150);
				}
			};

			panel.webview.onDidReceiveMessage(
				async (message) => {
					switch (message.command) {
						case 'uploadList':
							const res = await vscode.window.showInformationMessage(
								files.length + ' files will be uploaded to ' + uri.path + ', do you want to proceed?',
								{
									modal: true
								},
								'Yes',
								'No'
							);
							if (res === undefined || res === 'No') {
								return;
							}

							panel.webview.postMessage({
								command: 'uploadInProgress'
							});

							// Perform upload.
							try {
								// Clear list and send to web view.
								files = [];
								refreshList();

								panel.webview.postMessage({
									command: 'uploadEnd'
								});
							} catch(ex: any) {
								vscode.window.showErrorMessage(ex.message);
								logger.appendErrorToMessages('sftpfs.bulkFileUpload', 'Error to bulk upload...', ex);

								panel.webview.postMessage({
									command: 'uploadEnd'
								});
							}
							break;
						case 'cancelList':
							files = [];
							refreshList();
							vscode.window.showInformationMessage('File list cleared.');
							break;
						case 'fileDropped':
							const file = message.file as FileUploadRequest;
							
							files = files.filter((f) => {
								return f.name.toLowerCase() !== file.name.toLowerCase();
							});
							files.push(file);

							refreshList();
							break;
						case 'showInfoMessage':
							vscode.window.showInformationMessage(message.content);
							break;
						case 'showWarningMessage':
							vscode.window.showWarningMessage(message.content);
							break;
						case 'showErrorMessage':
							vscode.window.showErrorMessage(message.content);
							break;
					}
				},
				undefined,
				context.subscriptions
			);


    })
  );
}

function getWebviewContent(uri: vscode.Uri, bootstrapJs: vscode.Uri, bootstrapCss: vscode.Uri) {
  return `
    <!DOCTYPE html>
    <html lang="en" data-bs-theme="dark">
    <head>
      <meta charset="UTF-8">
			<link href="${bootstrapCss}" rel="stylesheet">
      <style>
        body, html { 
					width: 100vw; height: 100vh; 
				}
				body {
					display: flex; 
					justify-content: center;
				}
        .drop-zone {
					margin-top: 20px;
          height: 200px;
					min-height: 200px;
          border: 2px dashed #888;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #888;
          font-size: 1.2em;
        }
        .drop-zone.drag-over {
          border-color: #4CAF50;
          color: #4CAF50;
        }

				.main-box {
					margin-top: 50px;
					display: flex;
					flex-direction: column;
					width: 80%;
				}
      </style>
    </head>
    <body>

			<div class="main-box" id="mainBox">
				<div>
					Drag files to upload to the remote folder <b>${uri.path}</b>.
				</div>

				<div class="drop-zone" id="dropZone">Drag files here</div>

				<hr>

				<div class="file-list mt-3">
					<h5 class="mb-1 d-flex justify-content-between">
						<div><span id="file-list-count">0</span> Files Selected</div>
						<div><span class="btn btn-primary" onClick="upload()">Upload files</span> <span class="btn btn-danger ms-2" onClick="cancel()">Cancel</span></div>
					</h5>

					<table style="margin-top: 30px;" class="table table-striped">
						<thead class="bg-primary">
							<tr class="bg-primary">
								<td class="bg-primary">File Name</td>
								<td class="bg-primary">Size</td>
								<td class="bg-primary">Type</td>
								<td class="bg-primary">Actions</td>
							</tr>
						</thead>
						<tbody id="file-list">
							<tr>
								<td colspan="4" class="text-center">No files selected.</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
			
			<script src="${bootstrapJs}"></script>
      <script>
				function cancel() {
					vscode.postMessage({ 
						command: 'cancelList'
					});
				}

				function upload() {
					vscode.postMessage({ 
						command: 'uploadList'
					});
				}

        const vscode = acquireVsCodeApi();

        const mainBox = document.getElementById('mainBox');
        const dropZone = document.getElementById('dropZone');

        // Add drag and drop event listeners
        mainBox.addEventListener('dragover', (event) => {
          event.preventDefault();
          dropZone.classList.add('drag-over');
        });

        mainBox.addEventListener('dragleave', () => {
          dropZone.classList.remove('drag-over');
        });

        mainBox.addEventListener('drop', (event) => {
					event.preventDefault();
					dropZone.classList.remove('drag-over');

					const filesArray = Array.from(event.dataTransfer.files);
					if (filesArray.length > 1000) {
						vscode.postMessage({ 
							command: 'showWarningMessage', 
							content: 'Please do not add more than 1000 files at same time.'
						});
						return;
					}
					const currentAmount = parseInt(document.getElementById('file-list-count').innerText);
					if ((currentAmount + filesArray.length) > 1000) {
						vscode.postMessage({ 
							command: 'showWarningMessage', 
							content: 'You cannot select more than 1000 files, there are ' + (1000 - currentAmount) + ' remaining files to select and you have tried to select ' + filesArray.length + ' files.'
						});
						return;
					}
					const files = filesArray.map(file => {
						if (file.size > 100 * 1024 * 1024) {
							vscode.postMessage({ 
								command: 'showWarningMessage', 
								content: 'Size of ' + file.name + ' file is too long, maximum allowed is 100 MB.'
							});
							return;
						};

						const reader = new FileReader();
						
						reader.onload = () => {
							const fileContent = reader.result; // This will contain the content of the file
							
							vscode.postMessage({ 
								command: 'fileDropped', 
								file: {
									name: file.name,
									size: file.size,
									type: file.type,
									content: fileContent // File content here
								}
							});
						};
						
						reader.onerror = (error) => {
							vscode.postMessage({ 
								command: 'showWarningMessage', 
								content: 'Failed to read ' + file.name + ' file, upload of directories are not supported yet using this method.'
							});
							console.error('Error reading file:', error);
						};

						// Read the file content as text (you can also use readAsDataURL for binary files)
						reader.readAsDataURL(file);
					});
        });

        // Handle messages from the extension
        window.addEventListener('message', (event) => {
          const message = event.data;
          switch (message.command) {
            case 'displayFiles':
							if (message.files.length == 0) {
								document.getElementById('file-list-count').innerText = '0';
								document.getElementById('file-list').innerHTML = '<tr><td colspan="4" class="text-center">No files selected.</td></tr>';
								return;
							}

							document.getElementById('file-list-count').innerText = '' + message.files.length;
							var finalHTML = '';
							for (const file of message.files) {
								finalHTML = finalHTML + '<tr><td>' + file.name + '</td><td>' + file.size + '</td><td>' + file.type + '</td><td><span class="btn btn-sm btn-danger">Delete</span></td></tr>';
							}
							
							const fileListDOM = document.getElementById('file-list');
							fileListDOM.innerHTML = finalHTML;
              break;
          }
        });
      </script>
    </body>
    </html>
  `;
}

// This method is called when your extension is deactivated
export async function deactivate() {
	console.log('Extension deactivated');
	await connectionManager.destroyAll();

	const provider = SFTPFileSystemProvider.instance;
	console.log('Disposing file system provider...');
	provider?.dispose();
}

async function closeEditorByUri(uri: vscode.Uri) {
	// Search for a tab with the given URI in all tab groups
	const tabsToRemove:vscode.Tab[] = [];
	for (const group of vscode.window.tabGroups.all) {
		for (const tab of group.tabs) {
			if (tab.input instanceof vscode.TabInputText) {
				const tabUri = tab.input.uri;
				if (tabUri.scheme === uri.scheme) {
					if (tabUri.authority === uri.authority) {
						if (tabUri.fsPath.startsWith(uri.fsPath)) {
							// Close the tab
							tabsToRemove.push(tab);
						}
					}
				}
			}
		}
	}
	await vscode.window.tabGroups.close(tabsToRemove);
}

export interface FileUploadRequest {
	content: string,
	name: string,
	size: number,
	type: string
}
