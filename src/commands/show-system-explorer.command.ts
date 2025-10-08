import { BaseCommand } from './base-command';
import * as vscode from 'vscode';
import * as upath from 'upath';
import { ScopedLogger } from '../base/logger';

export class ShowSystemExplorerCommand extends BaseCommand {
  private logger = new ScopedLogger('ShowSystemExplorerCommand');

  async callback(uri: vscode.Uri) {
    try {
      this.logger.logMessage(
        'Show in system explorer for file, scheme=' +
          uri.scheme +
          ', authority=' +
          uri.authority +
          ', path=' +
          uri.path,
      );

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
          this.logger.logMessage('Making folder... ' + calculatedLocalFile.fsPath);
          await vscode.workspace.fs.createDirectory(calculatedLocalFile);
        }

        // open...
        this.logger.logMessage('Opening folder... ' + calculatedLocalFile.fsPath);
        await provider.openLocalFolderInExplorer(calculatedLocalFile);
      } else {
        if (statFile.type === vscode.FileType.SymbolicLink) {
          uri = await provider.followSymbolicLinkAndGetRealPath(uri);
        }

        // Download if needed
        this.logger.logMessage('Downloading file... ' + uri.path);
        await provider.downloadRemoteFileToLocalIfNeeded(uri, false, 'passive', false);

        this.logger.logMessage('Opening file... ' + calculatedLocalFile.fsPath);
        await provider.openLocalFolderInExplorer(calculatedLocalFile);
      }
    } catch (ex: any) {
      this.logger.logError('[sftpfs.showInSystemExplorer] Error', ex);
      vscode.window.showErrorMessage(ex.message);
    }
  }
}
