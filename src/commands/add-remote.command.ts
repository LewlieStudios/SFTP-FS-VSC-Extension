import { RemoteConfiguration } from '../base/configuration';
import { SFTPExtension } from '../base/vscode-extension';
import { BaseCommand } from './base-command';
import * as vscode from 'vscode';

export class AddRemoteCommand extends BaseCommand {
  async callback() {
    const data = await AddRemoteCommand.showFormModifyRemoteConfiguration(
      this.extension,
      undefined,
    );
    if (!data) {
      return;
    }

    // Save configuration...
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
        vscode.window
          .showInformationMessage('Remote "' + data.name + "' added.", 'Open configuration')
          .then((res) => {
            if (res === 'Open configuration') {
              vscode.commands.executeCommand('workbench.action.openSettings', '@ext:lewlie.sftpfs');
            }
          });
      })
      .catch((ex) => {
        vscode.window.showErrorMessage('Something went wrong...');
        this.extension.logger.appendErrorToMessages(
          'sftpfs.addRemote',
          'Unable to save remote configuration.',
          ex,
        );
      });
  }

  static async showFormModifyRemoteConfiguration(
    extension: SFTPExtension,
    existingConfigurationName: string | undefined,
  ) {
    const existingConfiguration: RemoteConfiguration | undefined = existingConfigurationName
      ? extension.configuration.getRemoteConfiguration(existingConfigurationName)
      : undefined;

    if (existingConfigurationName !== undefined && existingConfiguration === undefined) {
      vscode.window.showErrorMessage(
        'Remote configuration for "' + existingConfigurationName + '" not found.',
      );
      return;
    }

    const title = existingConfigurationName
      ? 'Editing Remote "' + existingConfigurationName + '"'
      : 'Add Remote';
    const name = (
      await vscode.window.showInputBox({
        title,
        prompt: 'Name to use for this remote configuration',
        placeHolder: 'A friendly name to identify this remote configuration',
        value: existingConfigurationName,
        validateInput: async (value) => {
          if (value.trim().length === 0) {
            return {
              message: 'Name should not be empty.',
              severity: vscode.InputBoxValidationSeverity.Error,
            } as vscode.InputBoxValidationMessage;
          }

          if (
            existingConfigurationName !== undefined &&
            value.trim().toLowerCase() === existingConfigurationName.trim().toLowerCase()
          ) {
            return;
          }

          const currentNames = await extension.configuration.getRemotesConfigurationNames();
          for (const name of currentNames) {
            if (name.trim().toLowerCase() === value.trim().toLowerCase()) {
              return {
                message: 'This name is already in use, please choose another one.',
                severity: vscode.InputBoxValidationSeverity.Error,
              } as vscode.InputBoxValidationMessage;
            }
          }
        },
      })
    )?.trim();

    if (!name) {
      return undefined;
    }

    const host = (
      await vscode.window.showInputBox({
        title,
        prompt: 'SFTP Host',
        placeHolder: 'sftp.example.com',
        value: existingConfiguration?.host,
        validateInput: (value) => {
          if (value.trim().length === 0) {
            return {
              message: 'Host should not be empty.',
              severity: vscode.InputBoxValidationSeverity.Error,
            } as vscode.InputBoxValidationMessage;
          }
        },
      })
    )?.trim();

    if (!host) {
      return undefined;
    }

    const port = await vscode.window.showInputBox({
      title,
      prompt: 'SFTP Port',
      placeHolder: 'Enter a valid port number, usually 22',
      value: existingConfiguration?.port?.toString() ?? '22',
      validateInput: (value) => {
        if (!/^[0-9]+$/.test(value)) {
          return {
            message: 'Port should be a valid number.',
            severity: vscode.InputBoxValidationSeverity.Error,
          } as vscode.InputBoxValidationMessage;
        }
      },
    });

    if (!port) {
      return undefined;
    }

    const username = (
      await vscode.window.showInputBox({
        title,
        prompt: 'SFTP Username',
        placeHolder: 'Enter username to connect',
        value: existingConfiguration?.username,
        validateInput: (value) => {
          if (value.trim().length === 0) {
            return {
              message: 'Username should not be empty.',
              severity: vscode.InputBoxValidationSeverity.Error,
            } as vscode.InputBoxValidationMessage;
          }
        },
      })
    )?.trim();

    if (!username) {
      return undefined;
    }

    const password = await vscode.window.showInputBox({
      title,
      prompt: 'SFTP Password (optional)',
      placeHolder: 'Leave empty to not store password',
      password: true,
      value: existingConfiguration?.password,
    });

    const remotePath = await vscode.window.showInputBox({
      title,
      prompt: 'SFTP Remote Path (optional)',
      placeHolder: 'Enter the remote path to use as root, leave empty for /',
      value: existingConfiguration?.remotePath ?? '/',
    });

    return {
      name,
      host,
      port,
      username,
      password,
      remotePath,
    };
  }
}
