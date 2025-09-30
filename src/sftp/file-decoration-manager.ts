import * as vscode from 'vscode';

export class FileDecorationManager {
  private _onDidChangeFileDecorations: vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined> =
    new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
  readonly onDidChangeFileDecorations: vscode.Event<vscode.Uri | vscode.Uri[] | undefined> =
    this._onDidChangeFileDecorations.event;

  private decorations = new Map<string, CachedDecoration>();
  private _bufferedEvents: CachedDecoration[] = [];
  private _fireSoonHandle?: NodeJS.Timeout;

  provideFileDecoration(uri: vscode.Uri): vscode.ProviderResult<vscode.FileDecoration> {
    if (uri.scheme !== 'sftp') {
      return undefined;
    }
    return this.decorations.get(uri.toString())?.decoration;
  }

  setRemoteFileDecoration(uri: vscode.Uri) {
    this.updateDecoration(uri, {
      badge: '☁️',
      tooltip: 'Remote file not present in local storage',
      propagate: false,
    });
  }

  setLocalUploadFileDecoration(uri: vscode.Uri) {
    this.updateDecoration(uri, {
      badge: '⬆️',
      tooltip:
        'This file do not exist on remote server, so you must upload it to sync file to remote.',
      propagate: false,
    });
  }

  setLocalNewFileDecoration(uri: vscode.Uri) {
    this.updateDecoration(uri, {
      badge: '✨⬆️',
      tooltip:
        'This file do not exist on remote server, so you must upload it to sync file to remote.',
      propagate: false,
    });
  }

  setRemoteDownloadFileDecoration(uri: vscode.Uri) {
    this.updateDecoration(uri, {
      badge: '⬇️',
      tooltip:
        'Remote file is more recent that the file you have in your local storage, this file needs to be downloaded',
      propagate: false,
    });
  }

  setUnknownStateFileDecoration(uri: vscode.Uri) {
    this.updateDecoration(uri, {
      badge: '❓',
      tooltip: 'Unknown state of the file',
      propagate: false,
    });
  }

  setUpToDateFileDecoration(uri: vscode.Uri) {
    this.updateDecoration(uri, {
      badge: '✅',
      tooltip:
        'File saved in your local storage, you have the most recent file (no changes from remote)',
      propagate: false,
    });
  }

  setDirectoryFileDecoration(uri: vscode.Uri) {
    this.updateDecoration(uri, {
      badge: '📁',
      tooltip: 'Folder present in your local storage',
      propagate: false,
    });
  }

  // Method to trigger decoration updates for specific URIs
  updateDecoration(uri: vscode.Uri, decoration: vscode.FileDecoration) {
    // console.log('Requested update decoration: ' + uri.toString());
    if (uri.scheme !== 'sftp') {
      return undefined;
    }

    this._bufferedEvents.push({
      realUri: uri,
      decoration,
    });

    if (this._fireSoonHandle) {
      clearTimeout(this._fireSoonHandle);
    }

    this._fireSoonHandle = setTimeout(() => {
      for (const event of this._bufferedEvents) {
        this.decorations.set(event.realUri.toString(), event);
        this._onDidChangeFileDecorations.fire(event.realUri);
      }
      this._bufferedEvents = [];
    }, 100);
  }
}

export interface CachedDecoration {
  realUri: vscode.Uri;
  decoration: vscode.FileDecoration;
}
