import { BaseCommand } from "./base-command";
import * as vscode from 'vscode';
import * as upath from 'upath';

export class RefreshDirectoryCommand extends BaseCommand {
  async callback(uri: vscode.Uri) {
    try {
      const provider = this.extension.sftpFileSystem;
      if (provider === undefined) {
        this.extension.logger.appendLineToMessages('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
        vscode.window.showErrorMessage('Unexpected: Cannot get file provider for remote "' + uri.authority + '".');
        return;
      }

      this.extension.vscodeStatusBarItem!.text = '$(cloud) Refreshing directory ' + uri.path;
      this.extension.logger.appendLineToMessages('[sftpfs.refreshDirectory] ' + uri.path);

      await provider.refreshDirectoryContent(uri);

      this.extension.vscodeStatusBarItem!.text = '$(cloud) Ready';
      vscode.window.showInformationMessage(upath.basename(uri.path) + '" directory refreshed.');
    } catch(ex: any) {
      this.extension.vscodeStatusBarItem!.text = '$(cloud) Ready';
      this.extension.logger.appendErrorToMessages('sftpfs.refreshDirectory', 'Failed due error:', ex);
      vscode.window.showErrorMessage('Operation failed: ' + ex.message);
    }
  }
}