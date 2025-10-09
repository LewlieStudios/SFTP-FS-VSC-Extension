import { BaseCommand } from './base-command';
import * as vscode from 'vscode';

export class RemoveRemoteCommand extends BaseCommand {
  async callback(remoteNames: string[] | undefined = undefined) {
    const names = this.extension.configuration.getRemotesConfigurationNames();

    if (names.length === 0) {
      vscode.window
        .showInformationMessage('Currently there is not any remote configured.', 'Add Remote')
        .then((res) => {
          if (res === 'Add Remote') {
            vscode.commands.executeCommand('sftpfs.addRemote');
          }
        });
      return;
    }

    if (remoteNames === undefined || remoteNames.length === 0) {
      vscode.window
        .showQuickPick(names, {
          placeHolder: 'Select a remote to remove...',
          canPickMany: true,
        })
        .then(async (selection) => {
          if (selection) {
            this.callback(selection);
          }
        });
      return;
    }

    for (const selection of remoteNames) {
      const active = this.extension.connectionManager.hasActiveResourceManager(selection);
      if (active) {
        vscode.window
          .showErrorMessage(
            'Remote connection "' +
              selection +
              '" is currently in use, please disconnect before removing it.',
            'Disconnect',
          )
          .then((res) => {
            if (res === 'Disconnect') {
              vscode.commands.executeCommand('sftpfs.disconnectRemote', selection);
            }
          });
        return;
      }
    }

    // Remove remote configuration
    this.extension.configuration
      .removeRemoteConfiguration(remoteNames)
      .then(() => {
        for (const selection of remoteNames) {
          vscode.window.showInformationMessage('Remote "' + selection + '" removed.');
        }
      })
      .catch((ex) => {
        vscode.window.showErrorMessage('Something went wrong...');
        this.extension.logger.appendErrorToMessages(
          'sftpfs.removeRemote',
          'Unable to delete remote configuration.',
          ex,
        );
      });
  }
}
