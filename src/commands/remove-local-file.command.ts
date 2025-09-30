import { BaseCommand } from './base-command';
import * as vscode from 'vscode';
import * as upath from 'upath';

export class RemoveLocalFileCommand extends BaseCommand {
  async callback(uri: vscode.Uri) {
    try {
      const provider = this.extension.sftpFileSystem;
      if (provider === undefined) {
        this.extension.logger.appendLineToMessages(
          'Unexpected: Cannot get file provider for remote "' + uri.authority + '".',
        );
        vscode.window.showErrorMessage(
          'Unexpected: Cannot get file provider for remote "' + uri.authority + '".',
        );
        return;
      }

      // Stat local file
      const localFile = provider.getLocalFileUri(uri.authority, uri);
      const localStat = await provider.statLocalFileByUri(localFile);

      if (localStat === undefined) {
        vscode.window.showInformationMessage('There is not a local version of this file.');
        return;
      }

      if (localStat.type === vscode.FileType.Directory) {
        const res = await vscode.window.showInformationMessage(
          'All files stored at ' +
            localFile.fsPath +
            ' on your local storage will be deleted. This will only delete your local files, leaving the remote files untouched. Do you wish to continue?',
          { modal: true },
          'Yes',
          'No',
        );
        if (res === 'No' || res === undefined) {
          return;
        }
      }

      await vscode.window.withProgress(
        {
          cancellable: true,
          location: vscode.ProgressLocation.Notification,
          title: 'Deleting local files...',
        },
        async (_, token) => {
          await provider.removeLocalFile(provider.getRemoteName(uri), uri, token);
          await this.extension.sftpFileSystem.closeVsCodeTabByFileUri(uri);
        },
      );

      vscode.window.showInformationMessage(
        'Local version of file "' + upath.basename(uri.path) + '" removed.',
      );

      // Send a refresh for the explorer
      provider.sendUpdateForRootFolder();
    } catch (ex: any) {
      this.extension.logger.appendErrorToMessages(
        'sftpfs.removeLocalFile',
        'Failed due error:',
        ex,
      );
      vscode.window.showErrorMessage('Operation failed: ' + ex.message);
    }
  }
}
