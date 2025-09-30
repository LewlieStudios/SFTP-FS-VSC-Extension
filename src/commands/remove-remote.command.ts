import { BaseCommand } from './base-command';
import * as vscode from 'vscode';

export class RemoveRemoteCommand extends BaseCommand {
  async callback() {
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

    vscode.window
      .showQuickPick(names, {
        placeHolder: 'Select a remote to remove...',
        canPickMany: true,
      })
      .then(async (selections) => {
        if (selections) {
          // Remove remote configuration
          this.extension.configuration
            .removeRemoteConfiguration(selections)
            .then(() => {
              for (const selection of selections) {
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
      });
  }
}
