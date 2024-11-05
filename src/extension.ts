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
												vscode.commands.executeCommand('workbench.action.openSettings', '@ext:wirlie.sftpfs');
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
							openLabel: 'Select'
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
				const calculatedLocalFile = provider.workDirPath.with({ path: upath.join(provider.workDirPath.fsPath, uri.path) });

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
				const provider = SFTPFileSystemProvider.sftpFileProvidersByRemotes.get(uri.authority);
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
					await provider.removeLocalFile(uri, token);
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
				const provider = SFTPFileSystemProvider.sftpFileProvidersByRemotes.get(uri.authority);
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
				const provider = SFTPFileSystemProvider.sftpFileProvidersByRemotes.get(uri.authority);
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
				const provider = SFTPFileSystemProvider.sftpFileProvidersByRemotes.get(uri.authority);
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
						const provider = SFTPFileSystemProvider.sftpFileProvidersByRemotes.get(workspace.uri.authority);
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
						const provider = SFTPFileSystemProvider.sftpFileProvidersByRemotes.get(uri.authority);
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
