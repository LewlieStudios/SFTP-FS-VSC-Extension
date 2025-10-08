import { asyncScheduler, Subject, Subscription, throttleTime } from 'rxjs';
import { SFTPExtension } from '../base/vscode-extension';
import { BaseWebViewProvider } from './base.view';
import * as vscode from 'vscode';

export class ConnectionsView extends BaseWebViewProvider {
  activeWebviewView?: vscode.WebviewView;
  lastProvidedConnections: Array<ConnectionItem> = [];

  private poolChangeSubscriptions: Map<string, Subscription> = new Map();
  private provideConnectionListChange = new Subject<void>();

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

  provideConnectionsList() {
    if (!this.activeWebviewView) return;

    this.extension.logger.appendLineToMessages;

    // Get connections from configuration
    const remotes = this.extension.configuration.getRemotesConfiguration();
    let index = 0;
    this.lastProvidedConnections = Object.keys(remotes)
      .map((remoteName) => {
        const config = remotes[remoteName];
        index += 1;
        const isActive = this.extension.connectionManager.hasActiveResourceManager(remoteName);
        let totalConnections = 0;
        if (isActive) {
          const resourceManager = this.extension.connectionManager.getResourceManager(remoteName);
          if (resourceManager) {
            const activeSubscription = this.poolChangeSubscriptions.get(remoteName);

            if (!activeSubscription) {
              // To prevent very quick successive updates, we throttle the updates to 2 second intervals
              // This ensures the UI remains responsive without being overwhelmed by rapid changes
              const subscription = resourceManager.poolChange.subscribe(() => {
                this.provideConnectionListChange.next();
              });
              this.poolChangeSubscriptions.set(remoteName, subscription);
            }

            totalConnections = resourceManager.getTotalConnections();
          }
        }
        return {
          id: index,
          name: remoteName,
          host: config.host || 'Unknown host',
          status: isActive ? 'active' : 'inactive',
          displayStatus: isActive ? 'Active (' + totalConnections + ' connections)' : 'Inactive',
        } as ConnectionItem;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    this.activeWebviewView.webview.postMessage({
      command: 'connections.provide-list',
      data: this.lastProvidedConnections,
    });
  }

  async openLocalFolderInExplorer(workDir: string) {
    const uri = vscode.Uri.file(workDir);
    // check if folder exists
    let folderStats: vscode.FileStat | undefined;
    const folderExists = await vscode.workspace.fs.stat(uri).then(
      (fileStat) => {
        folderStats = fileStat;
        return true;
      },
      () => false,
    );

    if (!folderExists || folderStats?.type !== vscode.FileType.Directory) {
      vscode.window.showErrorMessage(`The folder "${workDir}" does not exist locally.`, {
        modal: true,
      });
      return;
    }

    await vscode.commands.executeCommand('revealFileInOS', uri);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken,
  ): void | Thenable<void> {
    this.activeWebviewView = webviewView;
    const webview = webviewView.webview;

    this.provideConnectionListChange
      .pipe(throttleTime(2500, asyncScheduler, { leading: true, trailing: true })) // To prevent unresponsive UI, we throttle the updates to 2.5 seconds intervals
      .subscribe(() => {
        this.provideConnectionsList();
      });

    const configurationWatchDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('sftpfs.remotes')) {
        this.provideConnectionListChange.next();
      }
    });

    token.onCancellationRequested(() => {
      this.activeWebviewView = undefined;
      configurationWatchDisposable.dispose();
      this.poolChangeSubscriptions.forEach((subscription) => subscription.unsubscribe());
      this.poolChangeSubscriptions.clear();
      this.provideConnectionListChange.complete();
    });

    // Actions
    webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case 'connections.list':
          this.provideConnectionListChange.next();
          break;
        case 'connections.add':
          vscode.commands.executeCommand('sftpfs.addRemote');
          break;
        case 'connections.connect':
          // debug
          const remoteName = message.data;
          vscode.window.showInformationMessage(`Connect to connection: ${remoteName}`);
          break;
        case 'connections.edit':
          const editRemoteName = message.data;
          vscode.commands.executeCommand('sftpfs.editRemote', editRemoteName);
          break;
        case 'connections.delete':
          vscode.commands.executeCommand('sftpfs.removeRemote');
          break;
        case 'connections.openFolder':
          {
            const openFolderName = message.data;
            const workDir = this.extension.configuration.getWorkDirForRemote(openFolderName);

            if (workDir === undefined) {
              vscode.window.showInformationMessage(
                `This remote connection does not have a configured local folder, connect first to configure it.`,
                { modal: true },
              );
              return;
            }

            this.openLocalFolderInExplorer(workDir);
          }
          break;
      }
    });

    // Content
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

          @media (max-width: 320px) {
            .connection-item__icon {
              display: none;
            }
          }

          @media (max-width: 260px) {
            .connection-item {
              display: block;
            }

            .connection-item__actions {
              margin-top: 12px;
            }
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

          .badge-active {
            background-color: #4CAF50;
          }

          .badge-inactive {
            background-color: #4b4b4bff;
          }
        </style>
      </head>
      <body>
        <section class="connections">
          <span class="connections__header">Configured Remote Connections</span>
          <vscode-button icon="add" appearance="primary" id="add-connection-button">Add...</vscode-button>
          <vscode-button icon="trash" appearance="primary" id="remove-connection-button">Remove...</vscode-button>
          <div class="connections-list" id="connections-list">
            <!-- EXAMPLE
            <article class="connection-item">
              <span class="connection-item__icon">
                <vscode-icon name="plug"></vscode-icon>
              </span>
              <div class="connection-item__body">
                <span class="connection-item__name">Connection 1</span>
                <span class="connection-item__meta">example.com.asd.asd.as.dsa.</span>
                <div>
                  <span class="connection-item__badge badge-disconnected">Not Connected</span>
                </div>
              </div>
              <div class="connection-item__actions">
                <vscode-button appearance="icon" aria-label="Connect" title="Connect" icon="plug"></vscode-button>
                <vscode-button appearance="icon" aria-label="Edit" title="Edit" icon="edit"></vscode-button>
                <vscode-button appearance="icon" aria-label="Edit" title="Open Local Folder" icon="folder"></vscode-button>
              </div>
            </article>
            -->
          </div>
        </section>

        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          let connections = [];

          vscode.postMessage({ command: 'connections.list' });

          window.addEventListener('message', (event) => {
            const message = event.data;
            if (!message?.command) {
              return;
            }

            if (message.command === 'connections.provide-list') {
              connections = message.data;
              // Update the UI with the list of connections
              console.log('Received connections:', connections);
              const connectionsList = document.getElementById('connections-list');
              connectionsList.innerHTML = '';
              connections.forEach((connection) => {
                const article = document.createElement('article');
                article.className = 'connection-item';
                article.innerHTML = \`
                  <span class="connection-item__icon">
                    <vscode-icon name="plug"></vscode-icon>
                  </span>
                  <div class="connection-item__body">
                    <span class="connection-item__name">\${connection.name}</span>
                    <span class="connection-item__meta">\${connection.host}</span>
                    <div>
                      <span class="connection-item__badge badge-\${connection.status}">\${connection.displayStatus}</span>
                    </div>
                  </div>
                  <div class="connection-item__actions">
                    <vscode-button appearance="icon" aria-label="Connect" title="Connect" icon="plug" id="connect-button-\${connection.id}"></vscode-button>
                    <vscode-button appearance="icon" aria-label="Edit" title="Edit" icon="edit" id="edit-button-\${connection.id}"></vscode-button>
                    <vscode-button appearance="icon" aria-label="Open Local Folder" title="Open Local Folder" icon="folder" id="open-folder-button-\${connection.id}"></vscode-button>
                  </div>
                \`;
                connectionsList.appendChild(article);
              });

              // Additional event listeners for connect, edit, delete buttons can be added here
              connections.forEach((connection) => {
                console.log('Adding event listeners for connection:', connection.id, connection.name);
                document.getElementById(\`connect-button-\${connection.id}\`).addEventListener('click', () => {
                  vscode.postMessage({ command: 'connections.connect', data: connection.name });
                });
                document.getElementById(\`edit-button-\${connection.id}\`).addEventListener('click', () => {
                  vscode.postMessage({ command: 'connections.edit', data: connection.name });
                });
                document.getElementById(\`open-folder-button-\${connection.id}\`).addEventListener('click', () => {
                  vscode.postMessage({ command: 'connections.openFolder', data: connection.name });
                });
              });
            }
          });

          document.getElementById('add-connection-button').addEventListener('click', () => {
            vscode.postMessage({ command: 'connections.add' });
          });

          document.getElementById('remove-connection-button').addEventListener('click', () => {
            vscode.postMessage({ command: 'connections.delete' });
          });
        </script>
      </body>
    `;
  }
}

interface ConnectionItem {
  id: number;
  name: string;
  host: string;
  status: 'active' | 'inactive';
  displayStatus: string;
}
