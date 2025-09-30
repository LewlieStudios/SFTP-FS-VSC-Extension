import * as vscode from 'vscode';
import { SFTPExtension } from '../base/vscode-extension';

export abstract class BaseCommand {
  constructor(
    public extension: SFTPExtension,
    public name: string,
  ) {}

  abstract callback(...args: any): Promise<void> | void;

  register() {
    const disposable = vscode.commands.registerCommand(this.name, (...args: any) => {
      this.callback(...args);
    });
    this.extension.context.subscriptions.push(disposable);
  }
}
