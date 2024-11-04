import * as vscode from 'vscode';

export class FileDecorationManager {
  private _onDidChangeFileDecorations: vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined> = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
  readonly onDidChangeFileDecorations: vscode.Event<vscode.Uri | vscode.Uri[] | undefined> = this._onDidChangeFileDecorations.event;

  private decorations = new Map<string, CachedDecoration>();
  private item!: vscode.StatusBarItem;

  provideFileDecoration(uri: vscode.Uri): vscode.ProviderResult<vscode.FileDecoration> {
    if (uri.scheme !== 'sftp') {
      return undefined;
    }
    return this.decorations.get(uri.toString())?.decoration;
  }

  setRemoteFileDecoration(uri: vscode.Uri) {
    this.updateDecoration(
      uri,
      {
        'badge': '☁️',
        'tooltip': 'Remote file not present in local storage',
        propagate: false
      }
    );
  }

  setRemoteDownloadFileDecoration(uri: vscode.Uri) {
    this.updateDecoration(
      uri,
      {
        'badge': '⬇️',
        'tooltip': 'Remote file is more recent that the file you have in your local storage, this file needs to be downloaded',
        propagate: false
      }
    );
  }

  setUnknownStateFileDecoration(uri: vscode.Uri) {
    this.updateDecoration(
      uri,
      {
        'badge': '❓',
        'tooltip': 'Unknown state of the file',
        propagate: false
      }
    );
  }

  setUpToDateFileDecoration(uri: vscode.Uri) {
    this.updateDecoration(
      uri,
      {
        'badge': '✅',
        'tooltip': 'File saved in your local storage, you have the most recent file (no changes from remote)',
        propagate: false
      }
    );
  }

  setDirectoryFileDecoration(uri: vscode.Uri) {
    this.updateDecoration(
      uri,
      {
        'badge': '📁',
        'tooltip': 'Folder present in your local storage',
        propagate: false
      }
    );
  }

  // Method to trigger decoration updates for specific URIs
  updateDecoration(uri: vscode.Uri, decoration: vscode.FileDecoration) {
    // console.log('Requested update decoration: ' + uri.toString());
    if (uri.scheme !== 'sftp') {
      return undefined;
    }
    this.decorations.set(uri.toString(), {
      realUri: uri,
      decoration
    });
    this._onDidChangeFileDecorations.fire(uri);
  }

	setStatusBarItem(item: vscode.StatusBarItem) {
		this.item = item;
	}

  getStatusBarItem() {
    return this.item;
  }
}

export interface CachedDecoration {
  realUri: vscode.Uri,
  decoration: vscode.FileDecoration
}

const fileDecorationManager = new FileDecorationManager();
export default fileDecorationManager;
