import { BaseCommand } from './base-command';
import * as vscode from 'vscode';

export class DisconnectDirectRemoteCommand extends BaseCommand {
  async callback(uri: vscode.Uri) {
    try {
      const remoteName = uri.authority;

      const response = await vscode.window.showInformationMessage(
        'Are you sure to disconnect? All current operation will be interrupted and files can be corrupted, it is recommended to cancel current running operations before disconnect from server.',
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
      await this.extension.connectionManager.getResourceManager(remoteName)?.close();

      // Close workspace
      if (vscode.workspace.workspaceFolders !== undefined) {
        let index = -1;
        let found = false;
        for (const workspace of vscode.workspace.workspaceFolders) {
          index++;
          if (workspace.uri.toString() === uri.toString()) {
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
          }, 100);
        }
      }
    } catch (ex: any) {
      this.extension.logger.appendErrorToMessages(
        'sftpfs.disconnectDirectRemote',
        'Error closing project:',
        ex,
      );
      vscode.window.showErrorMessage(ex.message);
    }
  }
}
