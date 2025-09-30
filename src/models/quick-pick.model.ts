import * as vscode from 'vscode';

export interface QuickPickItemWithValue extends vscode.QuickPickItem {
  value: string;
}
