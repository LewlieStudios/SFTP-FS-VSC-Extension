import { SFTPExtension } from '../base/vscode-extension';
import { BaseWebViewProvider } from './base.view';
import * as vscode from 'vscode';

export class ConnectionsView extends BaseWebViewProvider {
  constructor(extension: SFTPExtension) {
    super('sftpfs.manage-connections', extension);
  }

  nonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken,
  ): void | Thenable<void> {
    const webview = webviewView.webview;
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

    webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extension.context.extensionUri, 'media'),
        vscode.Uri.joinPath(this.extension.context.extensionUri, 'node_modules'),
        vscode.Uri.joinPath(this.extension.context.extensionUri, 'images'),
      ],
    };
    webviewView.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="${csp}">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Manage Connections</title>
        <script type="module" src="${vscodeElementsPath}" nonce="${nonce}"></script>
        <link rel="stylesheet" href="${codiconsPath}" id="vscode-codicon-stylesheet">
        <style>
          :root {
            color-scheme: light dark;
          }

          body {
            margin: 0;
            padding: 16px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background: var(--vscode-sideBar-background);
          }

          h1,
          p {
            margin: 0;
            line-height: 1.4;
          }

          .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 16px;
          }

          .toolbar__details {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .toolbar__title {
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-foreground);
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          .toolbar__subtitle {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
          }

          .connections {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .connections__header {
            font-size: 12px;
            font-weight: 600;
            color: var(--vscode-sideBarSectionHeader-foreground, var(--vscode-foreground));
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .connections-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .connection-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 8px;
            background: var(--vscode-list-inactiveSelectionBackground);
            border: 1px solid var(--vscode-sideBarSectionHeader-border, transparent);
            transition: background 120ms ease, border-color 120ms ease;
          }

          .connection-item:hover {
            background: var(--vscode-list-hoverBackground);
            border-color: var(--vscode-focusBorder);
          }

          .connection-item__icon vscode-icon {
            width: 20px;
            height: 20px;
          }

          .connection-item__body {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
            min-width: 0;
          }

          .connection-item__name {
            font-size: 13px;
            font-weight: 600;
            color: var(--vscode-foreground);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .connection-item__meta {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .connection-item__actions {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          vscode-button[appearance='icon'] {
            min-width: auto;
          }

          .toolbar-actions {
            margin-bottom: 16px;
          }

          .connection-item__badge {
            margin-top: 4px;
            display: inline-block;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: 600;
            border-radius: 5px;
            color: var(--vscode-button-foreground);
          }

          .badge-connected {
            background-color: #4CAF50;
          }

          .badge-disconnected {
            background-color: #F44336;
          }
        </style>
      </head>
      <body>
        <section class="toolbar">
          <div class="toolbar__details">
            <span class="toolbar__title">SFTP FS · Manage Connections</span>
          </div>
        </section>

        <section class="toolbar-actions">
          <vscode-button icon="add" appearance="primary">Add Connection</vscode-button>
        </section>

        <vscode-divider></vscode-divider>

        <section class="connections">
          <span class="connections__header">Connections</span>
          <div class="connections-list">
            <article class="connection-item">
              <span class="connection-item__icon">
                <vscode-icon name="account"></vscode-icon>
              </span>
              <div class="connection-item__body">
                <span class="connection-item__name">Connection 1</span>
                <span class="connection-item__meta">sftp://example.com</span>
                <div>
                  <span class="connection-item__badge badge-disconnected">Not Connected</span>
                </div>
              </div>
              <div class="connection-item__actions">
                <vscode-button appearance="icon" aria-label="Connect" title="Connect" icon="plug"></vscode-button>
                <vscode-button appearance="icon" aria-label="Edit" title="Edit" icon="edit"></vscode-button>
                <vscode-button appearance="icon" aria-label="Delete" title="Delete" icon="trash"></vscode-button>
              </div>
            </article>

            <article class="connection-item">
              <span class="connection-item__icon">
                <vscode-icon name="account"></vscode-icon>
              </span>
              <div class="connection-item__body">
                <span class="connection-item__name">Connection 2</span>
                <span class="connection-item__meta">sftp://demo.internal</span>
                <div>
                  <span class="connection-item__badge badge-connected">Connected</span>
                </div>
              </div>
              <div class="connection-item__actions">
                <vscode-button appearance="icon" aria-label="Connect" title="Connect" icon="plug"></vscode-button>
                <vscode-button appearance="icon" aria-label="More actions" title="More actions" icon="ellipsis"></vscode-button>
              </div>
            </article>
          </div>
        </section>
      </body>
    `;
  }
}
