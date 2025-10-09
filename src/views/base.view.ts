import { SFTPExtension } from '../base/vscode-extension';
import * as vscode from 'vscode';

export abstract class BaseWebViewProvider implements vscode.WebviewViewProvider {
  constructor(
    public identifier: string,
    public extension: SFTPExtension,
  ) {}

  register() {
    this.extension.context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(this.identifier, this),
    );
  }

  public abstract resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken,
  ): void | Thenable<void>;
}
