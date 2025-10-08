import { BaseCommand } from './base-command';
import * as vscode from 'vscode';
import * as upath from 'upath';
import { ScopedLogger } from '../base/logger';

export class RefreshDirectoryCommand extends BaseCommand {
  private logger = new ScopedLogger('RefreshDirectoryCommand');

  async callback(uri: vscode.Uri) {
    try {
      const provider = this.extension.sftpFileSystem;
      if (provider === undefined) {
        this.logger.logMessage(
          'Unexpected: Cannot get file provider for remote "' + uri.authority + '".',
        );
        vscode.window.showErrorMessage(
          'Unexpected: Cannot get file provider for remote "' + uri.authority + '".',
        );
        return;
      }

      this.extension.vscodeStatusBarItem!.text = '$(cloud) Refreshing directory ' + uri.path;
      this.logger.logMessage('[sftpfs.refreshDirectory] ' + uri.path);

      await provider.refreshDirectoryContent(uri);

      this.extension.vscodeStatusBarItem!.text = '$(cloud) Ready';
      vscode.window.showInformationMessage(upath.basename(uri.path) + '" directory refreshed.');
    } catch (ex: any) {
      this.extension.vscodeStatusBarItem!.text = '$(cloud) Ready';
      this.logger.logError('[sftpfs.refreshDirectory] Failed due error:', ex);
      vscode.window.showErrorMessage('Operation failed: ' + ex.message);
    }
  }
}
