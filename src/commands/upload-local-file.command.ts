import { BaseCommand } from "./base-command";
import * as vscode from 'vscode';
import * as upath from 'upath';

export class UploadLocalFileCommand extends BaseCommand{
  async callback(uri: vscode.Uri) {
    try {
      const provider = this.extension.sftpFileSystem;
      if (provider === undefined) {
        this.extension.logger.appendLineToMessages('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
        vscode.window.showErrorMessage('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
        return;
      }

      this.extension.logger.appendLineToMessages('[sftpfs.uploadLocalFile] ' + uri.path);
      
      const localPath = provider.getLocalFileUri(uri.authority, uri);
      await provider.uploadLocalFileToRemoteIfNeeded(uri.authority, localPath, 'passive', true);

      this.extension.vscodeStatusBarItem!.text = '$(cloud) Ready';
      vscode.window.showInformationMessage('Upload for "' + upath.basename(uri.path) + '" completed.');
    } catch(ex: any) {
      this.extension.vscodeStatusBarItem!.text = '$(cloud) Ready';
      this.extension.logger.appendErrorToMessages('sftpfs.uploadLocalFile', 'Failed due error:', ex);
      vscode.window.showErrorMessage('Operation failed: ' + ex.message);
    }
  }
}
