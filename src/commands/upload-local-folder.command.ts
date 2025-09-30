import { BaseCommand } from "./base-command";
import * as vscode from 'vscode';
import * as upath from 'upath';

export class UploadLocalFolderCommand extends BaseCommand {
  async callback(uri: vscode.Uri) {
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
        title: 'Uploading files...'
      }, async (progress, token) => {
        await provider.uploadRemoteFolderFromLocal(uri, progress, token);
      });
      
      this.extension.vscodeStatusBarItem!.text = '$(cloud) Ready';
      vscode.window.showInformationMessage('Upload for "' + upath.basename(uri.path) + '" completed.');
    } catch(ex: any) {
      this.extension.vscodeStatusBarItem!.text = '$(cloud) Ready';
      this.extension.logger.appendErrorToMessages('sftpfs.uploadLocalFolder', 'Failed due error:', ex);
      vscode.window.showErrorMessage('Operation failed: ' + ex.message);
    }
  }
}
