import * as vscode from 'vscode';
import { SFTPExtension } from './base/vscode-extension';

let extensionInstance: SFTPExtension | undefined = undefined;

export async function activate(context: vscode.ExtensionContext) {
  extensionInstance = new SFTPExtension(context);
  vscode.workspace.onDidChangeWorkspaceFolders(() => {});
  await extensionInstance.activate();
}

export async function deactivate() {
  await extensionInstance?.deactivate();
}
