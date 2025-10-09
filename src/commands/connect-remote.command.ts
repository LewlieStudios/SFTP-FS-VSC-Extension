import { QuickPickItemWithValue } from '../models/quick-pick.model';
import { BaseCommand } from './base-command';
import * as vscode from 'vscode';
import upath from 'upath';
import os from 'os';
import { ScopedLogger } from '../base/logger';

export class ConnectRemoteCommand extends BaseCommand {
  private logger = new ScopedLogger('ConnectRemoteCommand');
  private vscodeRemoteConnectQuickPick?: vscode.QuickPick<QuickPickItemWithValue> = undefined;

  async callback(remoteName?: string) {
    const names = this.extension.configuration.getRemotesConfigurationNames();

    if (names.length === 0) {
      vscode.window
        .showInformationMessage(
          'Currently there is not any remote connection configured.',
          'Add Remote Connection',
        )
        .then((res) => {
          if (res === 'Add Remote Connection') {
            vscode.commands.executeCommand('sftpfs.addRemote');
          }
        });
      return;
    }

    if (remoteName === undefined) {
      if (this.vscodeRemoteConnectQuickPick === undefined) {
        this.vscodeRemoteConnectQuickPick = vscode.window.createQuickPick<QuickPickItemWithValue>();

        const didAcceptDisposable = this.vscodeRemoteConnectQuickPick.onDidAccept(async () => {
          if (!this.vscodeRemoteConnectQuickPick) {
            return;
          }
          const selectedItem = this.vscodeRemoteConnectQuickPick
            .selectedItems[0] as QuickPickItemWithValue;
          if (!selectedItem) {
            return;
          }

          if (selectedItem.value === 'internal:add_remote') {
            this.vscodeRemoteConnectQuickPick.hide();
            vscode.commands.executeCommand('sftpfs.addRemote');
          } else if (selectedItem.value.startsWith('remote:')) {
            this.vscodeRemoteConnectQuickPick.hide();
            const remoteName = selectedItem.value.replace('remote:', '');
            this.connect(remoteName);
          }
        });
        this.extension.context.subscriptions.push(didAcceptDisposable);

        const didTriggerItemButtonDisposable =
          this.vscodeRemoteConnectQuickPick.onDidTriggerItemButton(async (event) => {
            const item = event.item as QuickPickItemWithValue;
            if (item.value.startsWith('remote:')) {
              this.vscodeRemoteConnectQuickPick?.hide();
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
              iconPath: new vscode.ThemeIcon('edit'),
            },
          ],
        } as QuickPickItemWithValue);
      }
      this.vscodeRemoteConnectQuickPick.items = [
        {
          value: 'internal:add_remote',
          label: 'Add remote',
          description: 'Add a new remote configuration',
          iconPath: new vscode.ThemeIcon('add'),
        },
        {
          kind: vscode.QuickPickItemKind.Separator,
        } as any,
        ...namesItems,
      ];
      this.vscodeRemoteConnectQuickPick.show();
    } else {
      this.connect(remoteName);
    }
  }

  private async connect(remoteName: string) {
    const config = this.extension.configuration.getRemoteConfiguration(remoteName);

    if (config === undefined) {
      this.logger.logMessage(
        'Unexpected, configuration for remote "' + remoteName + '" is undefined.',
      );
      vscode.window.showErrorMessage(
        'Failed to get configuration for remote "' + remoteName + '".',
      );
      return;
    }

    // Already open?
    if (vscode.workspace.workspaceFolders !== undefined) {
      for (const workspaceDir of vscode.workspace.workspaceFolders) {
        if (
          workspaceDir.uri.scheme === 'sftp' &&
          workspaceDir.uri.authority.toLowerCase() === remoteName.toLowerCase()
        ) {
          vscode.window.showErrorMessage('Remote connection "' + remoteName + '" is already open.');
          return;
        }
      }
    }

    let workDir = this.extension.configuration.getWorkDirForRemote(remoteName);

    if (workDir === undefined) {
      await vscode.window.showInformationMessage(
        'You have not configured a local folder to synchronize files from remote connection "' +
          remoteName +
          '", please select a folder.',
        {
          modal: true,
        },
      );

      const dir = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: 'Select a local folder to sync remote files',
        openLabel: 'Select',
        defaultUri: vscode.Uri.file(upath.join(os.homedir())),
      });
      if (dir === undefined || dir.length === 0) {
        return;
      }

      const dirPath = dir[0];
      try {
        const stats = await vscode.workspace.fs.stat(dirPath);
        if (stats.type !== vscode.FileType.Directory) {
          this.logger.logMessage('Expected a directory but file found at: ' + dirPath.path);
          vscode.window.showErrorMessage(
            'File "' +
              dir +
              '" exists but it is not a directory, it is a file and can\'t be used as workdir.',
          );
          return;
        }
        this.logger.logMessage('Directory exists: ' + dirPath.path);
      } catch (ex: any) {
        if (ex instanceof vscode.FileSystemError && ex.code === 'FileNotFound') {
          this.logger.logMessage('Directory not exists, creating: ' + dirPath.path);
          try {
            await vscode.workspace.fs.createDirectory(dirPath);
            this.logger.logMessage('Directory created.');
          } catch (ex: any) {
            this.logger.logError(
              '[sftpfs.connectRemote] Error making directory: ' + dirPath.path,
              ex,
            );
            vscode.window.showErrorMessage('Failed to initialize workdir.');
            return;
          }
        } else {
          this.logger.logError(
            '[sftpfs.connectRemote] Failed to stat directory: ' + dirPath.path,
            ex,
          );
          vscode.window.showErrorMessage('Failed to initialize workdir.');
          return;
        }
      }

      workDir = dirPath.path;

      try {
        await this.extension.configuration.setWorkDirForRemote(remoteName, workDir);
      } catch (ex: any) {
        this.logger.logError(
          '[sftpfs.connectRemote] Failed to save workspace configuration for remote connection "' +
            remoteName +
            '", path to save: ' +
            dirPath.path,
          ex,
        );
        vscode.window.showErrorMessage('Failed to initialize workdir.');
        return;
      }
      this.logger.logMessage(
        'Using workdir for remote connection "' + remoteName + '": ' + workDir,
      );
    } else {
      this.logger.logMessage(
        'Workdir loaded for remote connection "' + remoteName + '": ' + workDir,
      );

      const dirPath = vscode.Uri.file(workDir);
      try {
        const stats = await vscode.workspace.fs.stat(dirPath);
        if (stats.type !== vscode.FileType.Directory) {
          this.logger.logMessage('Expected a directory but file found at: ' + dirPath.path);
          vscode.window.showErrorMessage(
            'File "' +
              dirPath.path +
              '" exists but it is not a directory, it is a file and can\'t be used as workdir.',
          );
          return;
        }
        this.logger.logMessage('Directory exists: ' + dirPath.path);
      } catch (ex: any) {
        if (ex instanceof vscode.FileSystemError && ex.code === 'FileNotFound') {
          this.logger.logMessage('Directory not exists, creating: ' + dirPath.path);
          try {
            await vscode.workspace.fs.createDirectory(dirPath);
            this.logger.logMessage('Directory created.');
          } catch (ex: any) {
            this.logger.logError(
              '[sftpfs.connectRemote] Error making directory: ' + dirPath.path,
              ex,
            );
            vscode.window.showErrorMessage('Failed to initialize workdir.');
            return;
          }
        } else {
          this.logger.logError(
            '[sftpfs.connectRemote] Failed to stat directory: ' + dirPath.path,
            ex,
          );
          vscode.window.showErrorMessage('Failed to initialize workdir.');
          return;
        }
      }
    }

    if (!this.extension.connectionManager.hasActiveResourceManager(remoteName)) {
      console.log('Creating connection pool!');
      await this.extension.connectionManager.createResourceManager({
        configuration: config,
        remoteName: remoteName,
      });
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification, // Location of the progress indicator
        title:
          'Connecting to SFTP (' +
          config.host +
          ':' +
          config.port +
          ' at ' +
          (config.remotePath ?? '/') +
          ') ...', // Title of the progress notification
        cancellable: false, // Allow cancellation
      },
      async () => {
        try {
          const connection = await (
            await this.extension.connectionManager
              .getResourceManager(remoteName)
              ?.getPool('passive')
          )?.acquire();
          if (connection === undefined) {
            await this.extension.connectionManager.destroyResourceManager(remoteName);
            throw Error('SFTP Connection lost.');
          }
          // If connection is success, add workspace to project...
          const removeLeadingSlash = (config.remotePath ?? '/').replace(/^\/+/, '');
          const virtualFolderUri = vscode.Uri.parse(
            'sftp://' + remoteName + '/' + removeLeadingSlash,
          );
          console.warn(virtualFolderUri);
          vscode.workspace.updateWorkspaceFolders(
            vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0,
            null,
            {
              uri: virtualFolderUri,
              name: 'SFTP - ' + remoteName + ' - ' + (config.remotePath ?? '/'),
            },
          );
        } catch (ex: any) {
          await this.extension.connectionManager.destroyResourceManager(remoteName);
          this.logger.logError(
            '[sftpfs.connectRemote] Failed to connect to remote "' + remoteName + '".',
            ex,
          );
          vscode.window.showErrorMessage(
            'Failed to connect to remote "' +
              remoteName +
              '": ' +
              (ex.message ? ex.message : ex.toString()),
          );
        }
      },
    );
  }
}
