import { BaseCommand } from './base-command';
import * as vscode from 'vscode';
import * as upath from 'upath';

export class ShowSystemExplorerCommand extends BaseCommand {
  async callback(uri: vscode.Uri) {
    try {
      this.extension.logger.appendLineToMessages(
        'Show in system explorer for file, scheme=' +
          uri.scheme +
          ', authority=' +
          uri.authority +
          ', path=' +
          uri.path,
      );

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

      let statFile = await provider.stat(uri);

      const remoteName = provider.getRemoteName(uri);
      const workDirPath = provider.getSystemProviderData(remoteName)!.workDirPath;
      const calculatedLocalFile = workDirPath.with({
        path: upath.join(workDirPath.fsPath, uri.path),
      });

      if (statFile.type === vscode.FileType.Directory) {
        // is a directory, so at least we should make the directory local.
        const localFileStats = await provider.statLocalFileByUri(calculatedLocalFile);
        if (localFileStats === undefined) {
          // local file not exists!
          this.extension.logger.appendLineToMessages(
            'Making folder... ' + calculatedLocalFile.fsPath,
          );
          await vscode.workspace.fs.createDirectory(calculatedLocalFile);
        }

        // open...
        this.extension.logger.appendLineToMessages(
          'Opening folder... ' + calculatedLocalFile.fsPath,
        );
        await provider.openLocalFolderInExplorer(calculatedLocalFile);
      } else {
        if (statFile.type === vscode.FileType.SymbolicLink) {
          uri = await provider.followSymbolicLinkAndGetRealPath(uri);
        }

        // Download if needed
        this.extension.logger.appendLineToMessages('Downloading file... ' + uri.path);
        await provider.downloadRemoteFileToLocalIfNeeded(uri, false, 'passive', false);

        this.extension.logger.appendLineToMessages('Opening file... ' + calculatedLocalFile.fsPath);
        await provider.openLocalFolderInExplorer(calculatedLocalFile);
      }
    } catch (ex: any) {
      this.extension.logger.appendErrorToMessages('sftpfs.showInSystemExplorer', 'Error', ex);
      vscode.window.showErrorMessage(ex.message);
    }
  }
}
