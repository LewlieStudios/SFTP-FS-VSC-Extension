import { BaseCommand } from './base-command';
import * as vscode from 'vscode';

export class AddRemoteCommand extends BaseCommand {
  async callback() {
    const panel = vscode.window.createWebviewPanel(
      'sftpfs.addRemote',
      'SFTP - Add Remote',
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.extension.context.extensionUri, 'media'),
          vscode.Uri.joinPath(this.extension.context.extensionUri, 'node_modules'),
          vscode.Uri.joinPath(this.extension.context.extensionUri, 'images'),
        ],
      },
    );
    panel.webview.html = this.createWebviewContent(panel.webview);
    panel.title = 'Add Remote';
    // Listen for messages from the webview (the form submit)
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

        // Basic validation
        if (!data || !data.name || !data.host || !data.port || !data.username) {
          vscode.window.showErrorMessage('Please fill all required fields.');
          return;
        }

        const portNumber = typeof data.port === 'number' ? data.port : parseInt(String(data.port));
        if (isNaN(portNumber) || portNumber <= 0) {
          vscode.window.showErrorMessage('Port must be a valid number.');
          return;
        }

        const currentNames = this.extension.configuration.getRemotesConfigurationNames();
        for (const name of currentNames) {
          if (name.trim().toLowerCase() === data.name!.trim().toLowerCase()) {
            vscode.window.showErrorMessage(
              'Remote configuration with name "' +
                data.name +
                '" already exists, please choose another name for this remote.',
              { modal: true },
            );
            return;
          }
        }

        // Save configuration...
        await this.extension.configuration.saveRemoteConfiguration(
          data.name,
          data.host,
          portNumber,
          data.username,
          data.remotePath ?? '/',
          data.password,
        );

        panel.dispose();

        vscode.window
          .showInformationMessage('Remote "' + data.name + "' added.", 'Open configuration')
          .then((res) => {
            if (res === 'Open configuration') {
              vscode.commands.executeCommand('workbench.action.openSettings', '@ext:lewlie.sftpfs');
            }
          });
      } catch (ex) {
        vscode.window.showErrorMessage('Something went wrong...');
        const err = ex instanceof Error ? ex : new Error(String(ex));
        this.extension.logger.appendErrorToMessages(
          'sftpfs.addRemote',
          'Unable to save remote configuration.',
          err,
        );
      }
    });

    // Dispose the listener when panel is closed
    panel.onDidDispose(() => {
      try {
        messageListener.dispose();
      } catch (e) {
        // ignore
      }
    });
  }

  createWebviewContent(webview: vscode.Webview) {
    // Create a URI that can be used inside the webview for the local script
    const vscodeElementsLocal = vscode.Uri.joinPath(
      this.extension.context.extensionUri,
      'node_modules',
      '@vscode-elements',
      'elements',
      'dist',
      'bundled.js',
    );
    const vscodeElementsPath = webview.asWebviewUri(vscodeElementsLocal);
    const codiconsLocal = vscode.Uri.joinPath(
      this.extension.context.extensionUri,
      'node_modules',
      '@vscode',
      'codicons',
      'dist',
      'codicon.css',
    );
    const codiconsPath = webview.asWebviewUri(codiconsLocal);
    const nonce = this.nonce();
    const csp = `default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource} data:; script-src 'nonce-${nonce}'; connect-src https:;`;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="${csp}">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Add Remote</title>
        <script type="module" src="${vscodeElementsPath}" nonce="${nonce}"></script>
        <link rel="stylesheet" href="${codiconsPath}" id="vscode-codicon-stylesheet">
      </head>
      <body>
        <vscode-form-container responsive="true">
          <h1>Add Remote Configuration</h1>
          <p>Please fill the information to add a new remote configuration.</p>
          <vscode-divider></vscode-divider>
          <vscode-form-group variant="vertical">
            <vscode-label for="basic-textfield-name">
              Name:
            </vscode-label>
            <vscode-textfield
              id="basic-textfield-name"
              placeholder="Friendly name for this remote"
              required
            ></vscode-textfield>
            <vscode-form-helper>
              <p>
                A friendly name to identify this remote configuration.
              </p>
            </vscode-form-helper>
          </vscode-form-group>
          <vscode-form-group variant="vertical">
            <vscode-label for="basic-textfield-01">
              Host:
            </vscode-label>
            <vscode-textfield
              id="basic-textfield-01"
              placeholder="Enter the host"
              required
            ></vscode-textfield>
            <vscode-form-helper>
              <p>
                Enter the host name or IP address of the SFTP server.
              </p>
            </vscode-form-helper>
          </vscode-form-group>
          <vscode-form-group variant="vertical">
            <vscode-label for="basic-textfield-02">
              Port:
            </vscode-label>
            <vscode-textfield
              id="basic-textfield-02"
              placeholder="Enter the port"
              value="22"
              required
              type="number"
            ></vscode-textfield>
            <vscode-form-helper>
              <p>
                Enter the port number of the SFTP server.
              </p>
            </vscode-form-helper>
          </vscode-form-group>
          <vscode-form-group variant="vertical">
            <vscode-label for="basic-textfield-03">
              Username:
            </vscode-label>
            <vscode-textfield
              id="basic-textfield-03"
              placeholder="Enter the username"
              required
            ></vscode-textfield>
            <vscode-form-helper>
              <p>
                Enter the username to connect to the SFTP server.
              </p>
            </vscode-form-helper>
          </vscode-form-group>
          <vscode-form-group variant="vertical">
            <vscode-label for="basic-textfield-04">
              Password:
            </vscode-label>
            <vscode-textfield
              id="basic-textfield-04"
              placeholder="Enter the password"
              type="password"
            ></vscode-textfield>
            <vscode-form-helper>
              <p>
                Enter the password to connect to the SFTP server.
              </p>
            </vscode-form-helper>
          </vscode-form-group>
          <vscode-form-group variant="vertical">
            <vscode-label for="basic-textfield-05">
              Remote Path:
            </vscode-label>
            <vscode-textfield
              id="basic-textfield-05"
              placeholder="Enter the remote path, for example /"
              value="/"
            ></vscode-textfield>
            <vscode-form-helper>
              <p>
                Enter the root remote path to use
              </p>
            </vscode-form-helper>
          </vscode-form-group>
          <vscode-button id="submit-button" icon="add">Add Remote</vscode-button>
        </vscode-form-container>
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
              submit.addEventListener('click', function (ev) {
                // Read values from the form fields
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

  nonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
