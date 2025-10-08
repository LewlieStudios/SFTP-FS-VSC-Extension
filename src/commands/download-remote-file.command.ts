import { BaseCommand } from './base-command';
import * as vscode from 'vscode';
import * as upath from 'upath';
import { ScopedLogger } from '../base/logger';

export class DownloadRemoteFileCommand extends BaseCommand {
  private logger = new ScopedLogger('DownloadRemoteFileCommand');

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

      await provider.downloadRemoteFileToLocalIfNeeded(uri, false, 'passive', true);

      this.extension.vscodeStatusBarItem!.text = '$(cloud) Ready';
      vscode.window.showInformationMessage(
        'Download for "' + upath.basename(uri.path) + '" completed.',
      );
    } catch (ex: any) {
      this.extension.vscodeStatusBarItem!.text = '$(cloud) Ready';
      this.logger.logError('[sftpfs.downloadRemoteFile] Failed due error:', ex);
      vscode.window.showErrorMessage('Operation failed: ' + ex.message);
    }
  }
}
