import { BaseCommand } from './base-command';
import * as vscode from 'vscode';

export class DisconnectDirectRemoteCommand extends BaseCommand {
  async callback(uri: vscode.Uri) {
    try {
      const remoteName = uri.authority;

      // Call command sftpfs.disconnectRemote
      await vscode.commands.executeCommand('sftpfs.disconnectRemote', remoteName);
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
