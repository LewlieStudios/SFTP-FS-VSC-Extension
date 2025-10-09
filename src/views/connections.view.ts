import { asyncScheduler, Subject, Subscription, throttleTime } from 'rxjs';
import { SFTPExtension } from '../base/vscode-extension';
import { BaseWebViewProvider } from './base.view';
import * as vscode from 'vscode';
import { ScopedLogger } from '../base/logger';
import * as fs from 'fs';

export class ConnectionsView extends BaseWebViewProvider {
  activeWebviewView?: vscode.WebviewView;
  currentConnectionsInView: Array<ConnectionItem> = [];

  private connectionManagerSubscription?: Subscription;
  private poolChangeSubscriptions: Map<string, Subscription> = new Map();
  private provideConnectionListChange = new Subject<string | undefined>();
  private logger = new ScopedLogger('ConnectionsView');

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

  handleConnectionListChange(remoteName?: string) {
    if (!this.activeWebviewView) return;
    this.provideFullConnectionsList();
  }

  private provideFullConnectionsList() {
    if (!this.activeWebviewView) return;

    this.logger.logMessage('Providing connections list');

    // Get connections from configuration
    const remotes = this.extension.configuration.getRemotesConfiguration();
    this.currentConnectionsInView = Object.keys(remotes)
      .map((remoteName) => {
        const config = remotes[remoteName];
        const isActive = this.extension.connectionManager.hasActiveResourceManager(remoteName);
        let totalConnections = 0;
        if (isActive) {
          const resourceManager = this.extension.connectionManager.getResourceManager(remoteName);
          if (resourceManager) {
            const activeSubscription = this.poolChangeSubscriptions.get(remoteName);

            if (!activeSubscription) {
              const subscription = resourceManager.poolChange.subscribe(() => {
                this.provideConnectionListChange.next(resourceManager.remoteName);
              });
              this.poolChangeSubscriptions.set(remoteName, subscription);
            }

            totalConnections = resourceManager.getTotalConnections();
          }
        }
        return {
          remoteName,
          host: config.host || 'Unknown host',
          status: isActive ? 'active' : 'inactive',
          displayStatus: isActive ? 'Active' : 'Inactive',
          totalConnections: totalConnections,
          localFolderConfigured:
            this.extension.configuration.getWorkDirForRemote(remoteName) !== undefined,
        } as ConnectionItem;
      })
      .sort((a, b) => a.remoteName.localeCompare(b.remoteName));

    this.activeWebviewView.webview.postMessage({
      command: 'connections.provide-list',
      data: this.currentConnectionsInView,
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

    this.connectionManagerSubscription =
      this.extension.connectionManager.resourceManagersChange.subscribe((remoteName) => {
        this.provideConnectionListChange.next(remoteName);
      });

    this.provideConnectionListChange
      .pipe(throttleTime(100, asyncScheduler, { leading: true, trailing: true })) // To prevent unresponsive UI, we throttle the updates to 100 milliseconds intervals
      .subscribe((remoteName) => {
        this.handleConnectionListChange(remoteName);
      });

    const configurationWatchDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('sftpfs.remotes')) {
        this.provideConnectionListChange.next(undefined);
      }
    });

    token.onCancellationRequested(() => {
      this.activeWebviewView = undefined;
      configurationWatchDisposable.dispose();
      this.poolChangeSubscriptions.forEach((subscription) => subscription.unsubscribe());
      this.poolChangeSubscriptions.clear();
      this.provideConnectionListChange.complete();
      this.connectionManagerSubscription?.unsubscribe();
    });

    // Actions
    webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case 'connections.list':
          this.provideConnectionListChange.next(undefined);
          break;
        case 'connections.add':
          vscode.commands.executeCommand('sftpfs.addRemote');
          break;
        case 'connections.connect':
          // debug
          const remoteName = message.data;
          const connectAction =
            !this.extension.connectionManager.hasActiveResourceManager(remoteName);
          if (connectAction) {
            // execute connect command
            vscode.commands.executeCommand('sftpfs.connectRemote', remoteName);
          } else {
            // execute disconnect command
            vscode.commands.executeCommand('sftpfs.disconnectRemote', remoteName);
          }
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

    webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extension.context.extensionUri, 'media'),
        vscode.Uri.joinPath(this.extension.context.extensionUri, 'node_modules'),
        vscode.Uri.joinPath(this.extension.context.extensionUri, 'images'),
      ],
    };

    // Content
    const placeholderVsCodeElementsScriptPath = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extension.context.extensionUri,
        'node_modules',
        '@vscode-elements',
        'elements',
        'dist',
        'bundled.js',
      ),
    );
    const placeholderVsCodeCodiconsStylePath = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extension.context.extensionUri,
        'node_modules',
        '@vscode',
        'codicons',
        'dist',
        'codicon.css',
      ),
    );
    const placeholderNonce = this.nonce();
    const placeholderCSP = `default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource} data:; script-src 'nonce-${placeholderNonce}'; connect-src https:;`;

    // Load content from connections.view.html and replace placeholders
    const filePath = vscode.Uri.joinPath(
      this.extension.context.extensionUri,
      'src',
      'views',
      'connections.view.html',
    ).fsPath;
    const content = fs
      .readFileSync(filePath, 'utf8')
      .replace(/%%CSP%%/g, placeholderCSP)
      .replace(/%%NONCE%%/g, placeholderNonce)
      .replace(/%%VSCODE_ELEMENTS_SCRIPT_PATH%%/g, placeholderVsCodeElementsScriptPath.toString())
      .replace(/%%VSCODE_CODICONS_STYLE_PATH%%/g, placeholderVsCodeCodiconsStylePath.toString());

    webviewView.webview.html = content;
  }
}

interface ConnectionItem {
  remoteName: string;
  host: string;
  status: 'active' | 'inactive';
  displayStatus: string;
  totalConnections: number;
  localFolderConfigured: boolean;
}
