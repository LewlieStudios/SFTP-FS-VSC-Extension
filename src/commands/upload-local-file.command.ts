import { BaseCommand } from './base-command';
import * as vscode from 'vscode';
import * as upath from 'upath';
import { ScopedLogger } from '../base/logger';

export class UploadLocalFileCommand extends BaseCommand {
  private logger = new ScopedLogger('UploadLocalFileCommand');

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

      this.logger.logMessage('[sftpfs.uploadLocalFile] ' + uri.path);

      const localPath = provider.getLocalFileUri(uri.authority, uri);
      await provider.uploadLocalFileToRemoteIfNeeded(uri.authority, localPath, 'passive', true);

      this.extension.vscodeStatusBarItem!.text = '$(cloud) Ready';
      vscode.window.showInformationMessage(
        'Upload for "' + upath.basename(uri.path) + '" completed.',
      );
    } catch (ex: any) {
      this.extension.vscodeStatusBarItem!.text = '$(cloud) Ready';
      this.logger.logError('[sftpfs.uploadLocalFile] Failed due error:', ex);
      vscode.window.showErrorMessage('Operation failed: ' + ex.message);
    }
  }
}
