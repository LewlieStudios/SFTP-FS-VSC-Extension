import { OutputChannel } from "vscode";
import * as vscode from 'vscode';

export class Logger {
  messagesChannel!: OutputChannel;

  init() {
    this.messagesChannel = vscode.window.createOutputChannel('SFTP FS - Messages');
    this.messagesChannel.appendLine('This output channel will contain general messages related to SFTP FS.');
  }

  appendLineToMessages(content: string) {
    console.info(content);
    this.messagesChannel.appendLine(content);
  }

  appendErrorToMessages(usefulMessage: string, error: Error) {
    console.error('An error occurred: ' + usefulMessage + ': (' + error.message + '): ' + error.stack);
    this.messagesChannel.appendLine('An error occurred: ' + usefulMessage + ': (' + error.message + '): ' + error.stack);
  }
}

const logger = new Logger();
export default logger;
