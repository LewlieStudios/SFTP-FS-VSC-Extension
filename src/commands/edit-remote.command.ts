import { AddRemoteCommand } from './add-remote.command';
import { BaseCommand } from './base-command';
import * as vscode from 'vscode';

export class EditRemoteCommand extends BaseCommand {
  async callback(remoteName: string) {
    if (!remoteName || remoteName.trim().length === 0) {
      const choosedRemote = await vscode.window.showQuickPick(
        this.extension.configuration.getRemotesConfigurationNames(),
        {
          placeHolder: 'Please select a remote to edit...',
        },
      );

      if (!choosedRemote) {
        return;
      }

      remoteName = choosedRemote;
    }

    const config =
      this.extension.configuration.getRemoteConfiguration(remoteName);
    if (!config) {
      vscode.window.showErrorMessage(
        'Remote configuration for "' + remoteName + '" not found.',
      );
      return;
    }

    const data = await AddRemoteCommand.showFormModifyRemoteConfiguration(
      this.extension,
      remoteName,
    );
    if (!data) {
      return;
    }

    config.host = data.host;
    config.port = parseInt(data.port);
    config.username = data.username;
    config.password = data.password;
    config.remotePath = data.remotePath ?? '/';

    // Save this.configuration...
    if (remoteName !== data.name) {
      // Name changed, remove old and add new...
      await this.extension.configuration.removeRemoteConfiguration([
        remoteName,
      ]);
    }
    this.extension.configuration
      .saveRemoteConfiguration(
        data.name,
        data.host,
        parseInt(data.port),
        data.username,
        data.remotePath ?? '/',
        data.password,
      )
      .then(() => {
        let actionDescription = '';
        if (remoteName !== data.name) {
          actionDescription =
            'Remote updated and renamed to "' + data.name + '"';
        } else {
          actionDescription = 'Remote "' + data.name + '" updated';
        }
        vscode.window
          .showInformationMessage(actionDescription, 'Open configuration')
          .then((res) => {
            if (res === 'Open configuration') {
              vscode.commands.executeCommand(
                'workbench.action.openSettings',
                '@ext:lewlie.sftpfs',
              );
            }
          });
      })
      .catch((ex) => {
        vscode.window.showErrorMessage('Something went wrong...');
        this.extension.logger.appendErrorToMessages(
          'sftpfs.editRemote',
          'Unable to save remote configuration.',
          ex,
        );
      });
  }
}
