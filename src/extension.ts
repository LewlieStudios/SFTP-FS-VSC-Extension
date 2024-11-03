// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import logger from './logger';
import configuration from './configuration';
import connectionManager from './connection-manager';
import { SFTPFileSystemProvider } from './sftp-file-system';
import upath from 'upath';
import fileDecorationManager from './file-decoration-manager';

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
			vscode.workspace.registerFileSystemProvider('sftp', provider, { isCaseSensitive: true })
	);

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
												vscode.commands.executeCommand('workbench.action.openSettings', '@ext:wirlie.sftpfs');
											}
										});
									})
									.catch((ex) => {
										vscode.window.showErrorMessage('Something went wrong...');
										logger.appendErrorToMessages('Unable to save remote configuration.', ex);
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
						logger.appendErrorToMessages('Unable to delete remote configuration.', ex);
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

			if (vscode.workspace.workspaceFolders === undefined) {
				vscode.window.showWarningMessage('Please open a working folder.', 'Open Folder...').then((res) => {
					if (res === 'Open Folder...') {
						vscode.commands.executeCommand('vscode.openFolder');
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

					var workDir = await configuration.getWorkDirForRemote(remoteName);

					if (workDir === undefined) {
						const dir = await vscode.window.showInputBox({
							prompt: 'Enter a directory name to sync with SFTP, this directory will be created inside your current workspace.'
						});
						if (dir === undefined || dir.trim().length === 0) {
							return;
						}

						const firstWorkspace = vscode.workspace.workspaceFolders!.find((folder) => folder.uri.scheme === 'file');
						if (firstWorkspace === undefined) {
							logger.appendLineToMessages('Cannot found a workspace folder of scheme "file".');
							// TODO: Open folder selector.
							vscode.window.showWarningMessage('You must add a workspace of type "file".');
							return;
						}

						const dirPath = vscode.Uri.joinPath(firstWorkspace.uri, dir);

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
									logger.appendErrorToMessages('Error making directory: ' + dirPath.path, ex);
									vscode.window.showErrorMessage('Failed to initialize workdir.');
									return;
								}
							} else {
								logger.appendErrorToMessages('Failed to stat directory: ' + dirPath.path, ex);
								vscode.window.showErrorMessage('Failed to initialize workdir.');
								return;
							}
						}
						
						workDir = dirPath.path;
						try {
							await configuration.setWorkDirForRemote(remoteName, workDir);
						} catch(ex: any) {
							logger.appendErrorToMessages('Failed to save workspace configuration for remote name "' + remoteName + '", path to save: ' + dirPath.path, ex);
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
									logger.appendErrorToMessages('Error making directory: ' + dirPath.path, ex);
									vscode.window.showErrorMessage('Failed to initialize workdir.');
									return;
								}
							} else {
								logger.appendErrorToMessages('Failed to stat directory: ' + dirPath.path, ex);
								vscode.window.showErrorMessage('Failed to initialize workdir.');
								return;
							}
						}
					}

					vscode.window.withProgress(
						{
							location: vscode.ProgressLocation.Notification, // Location of the progress indicator
							title: 'Connecting to SFTP (' + config.host + ':' + config.port + ' at ' + (config.remotePath ?? '/') + ') ...', // Title of the progress notification
							cancellable: false, // Allow cancellation
						},
						async () => {
							await connectionManager.connect(
								{
									remoteName,
									configuration: config
								}
							);
							// If connection is success, add workspace to project...
							const removeLeadingSlash = (config.remotePath ?? '/').replace(/^\/+/, '');
							const virtualFolderUri = vscode.Uri.parse('sftp://' + remoteName + '/' + removeLeadingSlash);
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

				const provider = SFTPFileSystemProvider.sftpFileProvidersByRemotes.get(uri.authority);
				if (provider === undefined) {
					logger.appendLineToMessages('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
					vscode.window.showErrorMessage('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
					return;
				}

				var statFile = await provider.stat(uri);
				var realRemotePath = provider.resolveRealPath(uri);
				const calculatedLocalFile = provider.workDirPath.with({ path: upath.join(provider.workDirPath.fsPath, realRemotePath.path) });

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
						realRemotePath = await provider.followSymbolicLinkAndGetRealPath(realRemotePath);
					}

					// Download if needed
					logger.appendLineToMessages('Downloading file... ' + realRemotePath.path);
					await provider.downloadRemoteToLocalIfNeeded(realRemotePath, false);

					const directoryLocalPath = provider.getDirectoryPath(calculatedLocalFile);
					logger.appendLineToMessages('Opening folder... ' + directoryLocalPath.fsPath);
					await provider.openLocalFolderInExplorer(directoryLocalPath);
				}
			} catch(ex: any) {
				logger.appendErrorToMessages('[show in explorer] Error', ex);
				vscode.window.showErrorMessage(ex.message);
			}
		})
	);

	context.subscriptions.push(
		vscode.window.registerFileDecorationProvider(fileDecorationManager)
	);
}

// This method is called when your extension is deactivated
export async function deactivate() {
	console.log('Extension deactivated');
	await connectionManager.destroyAll();

	SFTPFileSystemProvider.sftpFileProvidersByRemotes.forEach((v) => {
		console.log('Disposing file system provider...');
		v.dispose();
	});
}
