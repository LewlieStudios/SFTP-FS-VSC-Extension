import { OutputChannel } from "vscode";
import * as vscode from 'vscode';

export class Logger {
  messagesChannel!: OutputChannel;
  messagesErrChannel!: OutputChannel;

  init() {
    this.messagesChannel = vscode.window.createOutputChannel('SFTP FS - Messages');
    this.messagesChannel.appendLine('This output channel will contain general messages related to SFTP FS.');
    this.messagesErrChannel = vscode.window.createOutputChannel('SFTP FS - Errors');
    this.messagesErrChannel.appendLine('This output channel will contain error messages related to SFTP FS.');
  }

  appendLineToMessages(content: string) {
    console.info(content);
    this.messagesChannel.appendLine(content);
  }

  appendErrorToMessages(prefix: string, usefulMessage: string, error: Error) {
    console.error('[' + prefix + '] An error occurred: ' + usefulMessage + ': (' + error.message + '): ' + error.stack);
    this.messagesErrChannel.appendLine('[' + prefix + '] ' + usefulMessage + ': (' + error.message + '): ' + error.stack);
  }
}

const logger = new Logger();
export default logger;
