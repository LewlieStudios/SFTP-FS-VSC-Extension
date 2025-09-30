import { BaseCommand } from "./base-command";
import * as vscode from 'vscode';
import * as upath from 'upath';

export class RefreshRemoteFolderCommand extends BaseCommand {
  async callback(uri: vscode.Uri) {
    // Resync in both directions
    try {
      const provider = this.extension.sftpFileSystem;
      if (provider === undefined) {
        this.extension.logger.appendLineToMessages('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
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
      
      this.extension.vscodeStatusBarItem!.text = '$(cloud) Ready';
      vscode.window.showInformationMessage('Syncing files for "' + upath.basename(uri.path) + '" completed.');
    } catch(ex: any) {
      this.extension.vscodeStatusBarItem!.text = '$(cloud) Ready';
      this.extension.logger.appendErrorToMessages('sftpfs.refreshRemoteFolder', 'Failed due error:', ex);
      vscode.window.showErrorMessage('Operation failed: ' + ex.message);
    }
  }
}