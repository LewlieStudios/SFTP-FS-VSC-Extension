import { BaseCommand } from './base-command';
import * as vscode from 'vscode';

export class DisconnectCommand extends BaseCommand {
  async callback(remoteName?: string) {
    try {
      const activeResources = this.extension.connectionManager.getActiveResourceManagers();
      // Show quick pick
      if (activeResources.length === 0) {
        vscode.window.showInformationMessage(
          'There are no active remote connections to disconnect.',
        );
        return;
      }

      if (remoteName === undefined) {
        const names = activeResources.map((rm) => rm.remoteName);
        const selection = await vscode.window.showQuickPick(names, {
          placeHolder: 'Select a remote connection to disconnect...',
          canPickMany: false,
        });
        if (selection) {
          remoteName = selection;
        } else {
          return;
        }
      }

      if (!this.extension.connectionManager.hasActiveResourceManager(remoteName)) {
        vscode.window.showInformationMessage(`Remote "${remoteName}" is not connected.`);
        return;
      }

      const response = await vscode.window.showInformationMessage(
        `Are you sure to disconnect from the remote connection "${remoteName}"? All unsaved changes will be lost and running operations will be interrupted.`,
        {
          modal: true,
        },
        'Yes',
        'No',
      );

      if (response === 'No' || response === undefined) {
        return;
      }

      // Ok, attempt a disconnect.
      await this.extension.connectionManager.destroyResourceManager(remoteName);

      // Close workspace
      if (vscode.workspace.workspaceFolders !== undefined) {
        let index = -1;
        let found = false;
        for (const workspace of vscode.workspace.workspaceFolders) {
          index++;
          if (workspace.uri.authority === remoteName) {
            found = true;
            break;
          }
        }
        if (found) {
          const provider = this.extension.sftpFileSystem;
          if (provider !== undefined) {
            await provider.dispose();
          }

          console.info('Closing workspace at ' + index);
          await vscode.commands.executeCommand('workbench.action.closeAllEditors');
          setTimeout(() => {
            vscode.workspace.updateWorkspaceFolders(index, 1);
            vscode.window.showInformationMessage(`Disconnected from "${remoteName}"`);
          }, 100);
        }
      }
    } catch (ex: any) {
      this.extension.logger.appendErrorToMessages(
        'sftpfs.disconnectRemote',
        'Error closing project:',
        ex,
      );
      vscode.window.showErrorMessage(ex.message);
    }
  }
}
