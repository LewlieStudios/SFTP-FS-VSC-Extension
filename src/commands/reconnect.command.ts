import { BaseCommand } from './base-command';
import * as vscode from 'vscode';

export class ReconnectCommand extends BaseCommand {
  async callback(uri: vscode.Uri) {
    if (uri.scheme !== 'sftp') {
      throw Error('Expected sftp uri');
    }

    const remoteName = uri.authority;
    const remoteConfiguration = this.extension.configuration.getRemoteConfiguration(remoteName);

    if (remoteConfiguration === undefined) {
      vscode.window.showErrorMessage('Cannot find configuration for remote "' + remoteName + '".');
      return;
    }

    const response = await vscode.window.showInformationMessage(
      'Are you sure to reconnect? All current operation will be interrupted and files can be corrupted, it is recommended to cancel current running operations before doing a reconnect.',
      {
        modal: true,
      },
      'Yes',
      'No',
    );

    if (response === 'No' || response === undefined) {
      return;
    }

    // Ok, attempt a reconnection.
    await this.extension.connectionManager.reconnect(remoteName);

    if (vscode.workspace.workspaceFolders !== undefined) {
      for (const workspace of vscode.workspace.workspaceFolders) {
        if (workspace.uri.scheme === 'sftp') {
          const provider = this.extension.sftpFileSystem;
          if (provider !== undefined) {
            provider.sendUpdateForRootFolder();
          }
        }
      }
    }
  }
}
