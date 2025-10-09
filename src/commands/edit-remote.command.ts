import { BaseCommand } from './base-command';
import * as vscode from 'vscode';

export class EditRemoteCommand extends BaseCommand {
  private currentPanel: vscode.WebviewPanel | undefined;

  async callback(remoteName: string) {
    this.disposeCurrentPanel();

    let selectedRemote = remoteName;
    if (!selectedRemote || selectedRemote.trim().length === 0) {
      const choosedRemote = await vscode.window.showQuickPick(
        this.extension.configuration.getRemotesConfigurationNames(),
        {
          placeHolder: 'Please select a remote to edit...',
        },
      );

      if (!choosedRemote) {
        return;
      }

      selectedRemote = choosedRemote;
    }

    const normalizedRemoteName = selectedRemote.trim().toLowerCase();
    const config = this.extension.configuration.getRemoteConfiguration(normalizedRemoteName);
    if (!config) {
      vscode.window.showErrorMessage(
        'Remote configuration for "' + selectedRemote + '" not found.',
      );
      return;
    }

    // Check if not in use
    const inUse = this.extension.connectionManager.hasActiveResourceManager(normalizedRemoteName);
    if (inUse) {
      vscode.window
        .showErrorMessage(
          'Remote connection "' +
            selectedRemote +
            '" is currently in use, please disconnect it before editing.',
          'Disconnect',
        )
        .then((res) => {
          if (res === 'Disconnect') {
            vscode.commands.executeCommand('sftpfs.disconnectRemote', normalizedRemoteName);
          }
        });
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'sftpfs.editRemote',
      'SFTP - Edit Remote',
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.extension.context.extensionUri, 'media'),
          vscode.Uri.joinPath(this.extension.context.extensionUri, 'images'),
          vscode.Uri.joinPath(this.extension.context.extensionUri, 'webview'),
        ],
      },
    );

    panel.title = 'Edit Remote';
    panel.webview.html = this.createWebviewContent(panel.webview, selectedRemote, {
      host: config.host ?? '',
      port: config.port ?? 22,
      username: config.username ?? '',
      password: config.password ?? '',
      remotePath: config.remotePath ?? '/',
    });

    this.currentPanel = panel;

    const messageListener = panel.webview.onDidReceiveMessage(async (message) => {
      try {
        if (!message || message.command !== 'submit') {
          return;
        }

        const data = message.data as {
          name?: string;
          host?: string;
          port?: string | number;
          username?: string;
          password?: string | undefined;
          remotePath?: string | undefined;
        };

        if (!data || !data.name || !data.host || !data.port || !data.username) {
          vscode.window.showErrorMessage('Please fill all required fields.');
          return;
        }

        data.name = data.name.trim().toLowerCase();
        if (data.name.length === 0) {
          vscode.window.showErrorMessage('Remote name cannot be empty.');
          return;
        }

        const portNumber =
          typeof data.port === 'number' ? data.port : parseInt(String(data.port), 10);
        if (isNaN(portNumber) || portNumber <= 0) {
          vscode.window.showErrorMessage('Port must be a valid number.');
          return;
        }

        // only allow [a-zA-Z0-9-_ ] in name
        if (!/^[a-z0-9-_ ]+$/.test(data.name)) {
          vscode.window.showErrorMessage(
            'Remote name can only contain letters (a-z), numbers (0-9), spaces( ), hyphens (-) and underscores (_)',
          );
          return;
        }

        const currentNames = this.extension.configuration.getRemotesConfigurationNames();
        const normalizedOriginal = normalizedRemoteName;
        if (data.name !== normalizedOriginal) {
          for (const name of currentNames) {
            if (name.trim().toLowerCase() === data.name) {
              vscode.window.showErrorMessage(
                'Remote configuration with name "' +
                  data.name +
                  '" already exists, please choose another name for this remote.',
                { modal: true },
              );
              return;
            }
          }
        }

        await this.extension.configuration.saveRemoteConfiguration(
          data.name,
          data.host,
          portNumber,
          data.username,
          data.remotePath ?? '/',
          data.password,
        );

        if (data.name !== normalizedOriginal) {
          await this.extension.configuration.removeRemoteConfiguration([normalizedOriginal]);
        }

        panel.dispose();

        vscode.window
          .showInformationMessage(
            data.name !== normalizedOriginal
              ? 'Remote updated and renamed to "' + data.name + '"'
              : 'Remote "' + data.name + '" updated',
            'Open configuration',
          )
          .then((res) => {
            if (res === 'Open configuration') {
              vscode.commands.executeCommand('workbench.action.openSettings', '@ext:lewlie.sftpfs');
            }
          });
      } catch (ex) {
        vscode.window.showErrorMessage('Something went wrong...');
        const err = ex instanceof Error ? ex : new Error(String(ex));
        this.extension.logger.appendErrorToMessages(
          'sftpfs.editRemote',
          'Unable to save remote configuration.',
          err,
        );
      }
    });

    panel.onDidDispose(() => {
      try {
        messageListener.dispose();
      } catch (e) {
        // ignore
      }
      if (this.currentPanel === panel) {
        this.currentPanel = undefined;
      }
    });
  }

  createWebviewContent(
    webview: vscode.Webview,
    remoteName: string,
    data: { host: string; port: number; username: string; password: string; remotePath: string },
  ) {
    const vscodeElementsLocal = vscode.Uri.joinPath(
      this.extension.context.extensionUri,
      'webview',
      'vscode',
      'bundled.js',
    );
    const vscodeElementsPath = webview.asWebviewUri(vscodeElementsLocal);
    const codiconsLocal = vscode.Uri.joinPath(
      this.extension.context.extensionUri,
      'webview',
      'vscode',
      'codicon.css',
    );
    const codiconsPath = webview.asWebviewUri(codiconsLocal);
    const nonce = this.nonce();
    const csp = `default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource} data:; script-src 'nonce-${nonce}'; connect-src https:;`;

    const escaped = {
      name: this.escapeAttribute(remoteName),
      host: this.escapeAttribute(data.host),
      port: this.escapeAttribute(String(data.port ?? '')),
      username: this.escapeAttribute(data.username),
      password: this.escapeAttribute(data.password),
      remotePath: this.escapeAttribute(data.remotePath),
    };

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="${csp}">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Edit Remote</title>
        <script type="module" src="${vscodeElementsPath}" nonce="${nonce}"></script>
        <link rel="stylesheet" href="${codiconsPath}" id="vscode-codicon-stylesheet">
        <style>
          .bottom-space {
            height: 50px;
          }
        </style>
      </head>
      <body>
        <vscode-form-container responsive="true">
          <h1>Edit Remote Configuration</h1>
          <p>Update the information for the remote configuration.</p>
          <vscode-divider></vscode-divider>
          <vscode-form-group>
            <vscode-label for="basic-textfield-name">
              Name:
            </vscode-label>
            <vscode-textfield
              id="basic-textfield-name"
              placeholder="Friendly name for this remote"
              required
              value="${escaped.name}"
            ></vscode-textfield>
            <vscode-form-helper>
              <p>
                A friendly name to identify this remote configuration. Allowed characters are letters <code>a-z</code>, numbers <code>0-9</code>, spaces <code> </code>, hyphens <code>-</code> and underscores <code>_</code>.
              </p>
            </vscode-form-helper>
          </vscode-form-group>
          <vscode-form-group>
            <vscode-label for="basic-textfield-01">
              Host:
            </vscode-label>
            <vscode-textfield
              id="basic-textfield-01"
              placeholder="Enter the host"
              required
              value="${escaped.host}"
            ></vscode-textfield>
            <vscode-form-helper>
              <p>
                Enter the host name or IP address of the SFTP server.
              </p>
            </vscode-form-helper>
          </vscode-form-group>
          <vscode-form-group>
            <vscode-label for="basic-textfield-02">
              Port:
            </vscode-label>
            <vscode-textfield
              id="basic-textfield-02"
              placeholder="Enter the port"
              required
              type="number"
              value="${escaped.port}"
            ></vscode-textfield>
            <vscode-form-helper>
              <p>
                Enter the port number of the SFTP server.
              </p>
            </vscode-form-helper>
          </vscode-form-group>
          <vscode-form-group>
            <vscode-label for="basic-textfield-03">
              Username:
            </vscode-label>
            <vscode-textfield
              id="basic-textfield-03"
              placeholder="Enter the username"
              required
              value="${escaped.username}"
            ></vscode-textfield>
            <vscode-form-helper>
              <p>
                Enter the username to connect to the SFTP server.
              </p>
            </vscode-form-helper>
          </vscode-form-group>
          <vscode-form-group>
            <vscode-label for="basic-textfield-04">
              Password:
            </vscode-label>
            <vscode-textfield
              id="basic-textfield-04"
              placeholder="Enter the password"
              type="password"
              value="${escaped.password}"
            ></vscode-textfield>
            <vscode-form-helper>
              <p>
                Enter the password to connect to the SFTP server.
              </p>
            </vscode-form-helper>
          </vscode-form-group>
          <vscode-form-group>
            <vscode-label for="basic-textfield-05">
              Remote Path:
            </vscode-label>
            <vscode-textfield
              id="basic-textfield-05"
              placeholder="Enter the remote path, for example /"
              value="${escaped.remotePath}"
            ></vscode-textfield>
            <vscode-form-helper>
              <p>
                Enter the root remote path to use.
              </p>
            </vscode-form-helper>
          </vscode-form-group>
          <vscode-form-group>
            <vscode-button id="submit-button" icon="save">Save Changes</vscode-button>
          </vscode-form-group>
        </vscode-form-container>
        <div class="bottom-space"></div>
        <script nonce="${nonce}">
          (function () {
            // Acquire the VS Code API for the webview
            // @ts-ignore - acquireVsCodeApi is injected by VS Code
            const vscode = acquireVsCodeApi();

            function $id(id) {
              return document.getElementById(id);
            }

            const submit = $id('submit-button');
            if (submit) {
              submit.addEventListener('click', function () {
                const nameEl = $id('basic-textfield-name');
                const hostEl = $id('basic-textfield-01');
                const portEl = $id('basic-textfield-02');
                const usernameEl = $id('basic-textfield-03');
                const passwordEl = $id('basic-textfield-04');
                const remotePathEl = $id('basic-textfield-05');

                const getValue = (el) => (el && el.value !== undefined ? el.value : '');

                const payload = {
                  name: getValue(nameEl),
                  host: getValue(hostEl),
                  port: getValue(portEl),
                  username: getValue(usernameEl),
                  password: getValue(passwordEl),
                  remotePath: getValue(remotePathEl),
                };

                vscode.postMessage({ command: 'submit', data: payload });
              });
            }
          })();
        </script>
      </body>
      </html>`;
  }

  private escapeAttribute(value?: string) {
    if (!value) {
      return '';
    }
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private nonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private disposeCurrentPanel() {
    if (this.currentPanel) {
      try {
        this.currentPanel.dispose();
      } catch (e) {
        // ignore
      }
      this.currentPanel = undefined;
    }
  }
}
