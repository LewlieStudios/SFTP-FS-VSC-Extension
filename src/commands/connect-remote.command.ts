import { QuickPickItemWithValue } from "../models/quick-pick.model";
import { BaseCommand } from "./base-command";
import * as vscode from 'vscode';
import upath from 'upath';
import os from 'os';

export class ConnectRemoteCommand extends BaseCommand {
  async callback() {
    const names = this.extension.configuration.getRemotesConfigurationNames();
    
    if (names.length === 0) {
      vscode.window.showInformationMessage('Currently there is not any remote configured.', 'Add Remote').then((res) => {
        if (res === 'Add Remote') {
          vscode.commands.executeCommand('sftpfs.addRemote');
        }
      });
      return;
    }
    
    if (this.extension.vscodeRemoteConnectQuickPick === undefined) {
      this.extension.vscodeRemoteConnectQuickPick = vscode.window.createQuickPick<QuickPickItemWithValue>();
      
      const didAcceptDisposable = this.extension.vscodeRemoteConnectQuickPick.onDidAccept(async () => {
        if (!this.extension.vscodeRemoteConnectQuickPick) {
          return;
        }
        const selectedItem = this.extension.vscodeRemoteConnectQuickPick.selectedItems[0] as QuickPickItemWithValue;
        if (!selectedItem) {
          return;
        }
        
        if (selectedItem.value === 'internal:add_remote') {
          this.extension.vscodeRemoteConnectQuickPick.hide();
          vscode.commands.executeCommand('sftpfs.addRemote');
        } else if (selectedItem.value.startsWith('remote:')) {
          this.extension.vscodeRemoteConnectQuickPick.hide();
          const remoteName = selectedItem.value.replace('remote:', '');
          const config = this.extension.configuration.getRemoteConfiguration(remoteName);
          
          if (config === undefined) {
            this.extension.logger.appendLineToMessages('Unexpected, configuration for remote "' + remoteName + '" is undefined.');
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
          
          var workDir = this.extension.configuration.getWorkDirForRemote(remoteName);
          
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
                this.extension.logger.appendLineToMessages('Expected a directory but file found at: ' + dirPath.path);
                vscode.window.showErrorMessage('File "' + dir + '" exists but it is not a directory, it is a file and can\'t be used as workdir.');
                return;
              }
              this.extension.logger.appendLineToMessages('Directory exists: ' + dirPath.path);
            } catch(ex: any) {
              if (ex instanceof vscode.FileSystemError && ex.code === 'FileNotFound') {
                this.extension.logger.appendLineToMessages('Directory not exists, creating: ' + dirPath.path);
                try {
                  await vscode.workspace.fs.createDirectory(dirPath);
                  this.extension.logger.appendLineToMessages('Directory created.');
                } catch(ex: any) {
                  this.extension.logger.appendErrorToMessages('sftpfs.connectRemote', 'Error making directory: ' + dirPath.path, ex);
                  vscode.window.showErrorMessage('Failed to initialize workdir.');
                  return;
                }
              } else {
                this.extension.logger.appendErrorToMessages('sftpfs.connectRemote', 'Failed to stat directory: ' + dirPath.path, ex);
                vscode.window.showErrorMessage('Failed to initialize workdir.');
                return;
              }
            }
            
            workDir = dirPath.path;
            
            try {
              await this.extension.configuration.setWorkDirForRemote(remoteName, workDir);
            } catch(ex: any) {
              this.extension.logger.appendErrorToMessages('sftpfs.connectRemote', 'Failed to save workspace configuration for remote name "' + remoteName + '", path to save: ' + dirPath.path, ex);
              vscode.window.showErrorMessage('Failed to initialize workdir.');
              return;
            }
            this.extension.logger.appendLineToMessages('Using workdir for remote connection "' + remoteName + '": ' + workDir);
          } else {
            this.extension.logger.appendLineToMessages('Workdir loaded for remote connection "' + remoteName + '": ' + workDir);
            
            const dirPath = vscode.Uri.file(workDir);
            try {
              const stats = await vscode.workspace.fs.stat(dirPath);
              if (stats.type !== vscode.FileType.Directory) {
                this.extension.logger.appendLineToMessages('Expected a directory but file found at: ' + dirPath.path);
                vscode.window.showErrorMessage('File "' + dirPath.path + '" exists but it is not a directory, it is a file and can\'t be used as workdir.');
                return;
              }
              this.extension.logger.appendLineToMessages('Directory exists: ' + dirPath.path);
            } catch(ex: any) {
              if (ex instanceof vscode.FileSystemError && ex.code === 'FileNotFound') {
                this.extension.logger.appendLineToMessages('Directory not exists, creating: ' + dirPath.path);
                try {
                  await vscode.workspace.fs.createDirectory(dirPath);
                  this.extension.logger.appendLineToMessages('Directory created.');
                } catch(ex: any) {
                  this.extension.logger.appendErrorToMessages('sftpfs.connectRemote', 'Error making directory: ' + dirPath.path, ex);
                  vscode.window.showErrorMessage('Failed to initialize workdir.');
                  return;
                }
              } else {
                this.extension.logger.appendErrorToMessages('sftpfs.connectRemote', 'Failed to stat directory: ' + dirPath.path, ex);
                vscode.window.showErrorMessage('Failed to initialize workdir.');
                return;
              }
            }
          }
          
          if(!this.extension.connectionManager.poolExists(remoteName)) {
            console.log('Creating connection pool!');
            await this.extension.connectionManager.createPool({
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
              try {
                const connection = await (await this.extension.connectionManager.get(remoteName)?.getPool('passive'))?.acquire();
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
              } catch(ex: any) {
                this.extension.logger.appendErrorToMessages('sftpfs.connectRemote', 'Failed to connect to remote "' + remoteName + '".', ex);
                vscode.window.showErrorMessage('Failed to connect to remote "' + remoteName + '": ' + (ex.message ? ex.message : ex.toString()));
              }
            });
          }
        });
        this.extension.context.subscriptions.push(didAcceptDisposable);
        
        const didTriggerItemButtonDisposable = this.extension.vscodeRemoteConnectQuickPick.onDidTriggerItemButton(async (event) => {
          const item = event.item as QuickPickItemWithValue;
          if (item.value.startsWith('remote:')) {
            this.extension.vscodeRemoteConnectQuickPick?.hide();
            const remoteName = item.value.replace('remote:', '');
            vscode.commands.executeCommand('sftpfs.editRemote', remoteName);
          }
        });
        this.extension.context.subscriptions.push(didTriggerItemButtonDisposable);
      }
      
      const namesItems: QuickPickItemWithValue[] = [];
      for (const name of names) {
        const remoteConfiguration = this.extension.configuration.getRemoteConfiguration(name)!;
        namesItems.push({ 
          value: 'remote:' + name,
          label: name, 
          iconPath: new vscode.ThemeIcon('symbol-folder'),
          description: remoteConfiguration.host + ':' + remoteConfiguration.port,
          buttons: [
            {
              tooltip: 'Edit configuration',
              iconPath: new vscode.ThemeIcon('edit')
            }
          ]
        } as QuickPickItemWithValue);
      }
      this.extension.vscodeRemoteConnectQuickPick.items = [
        { 
          value: 'internal:add_remote',
          label: 'Add remote', 
          description: 'Add a new remote configuration', 
          iconPath: new vscode.ThemeIcon('add') 
        },
        { 
          kind: vscode.QuickPickItemKind.Separator 
        } as any,
        ...namesItems
      ];
      this.extension.vscodeRemoteConnectQuickPick.show();
    }
  }