import { OutputChannel } from 'vscode';
import * as vscode from 'vscode';
import { SFTPExtension } from './vscode-extension';

export class GlobalLogger {
  messagesChannel!: OutputChannel;
  messagesErrChannel!: OutputChannel;
  initialized = false;

  init() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    this.messagesChannel = vscode.window.createOutputChannel('SFTP FS - Messages');
    this.messagesChannel.appendLine(
      'This output channel will contain general messages related to SFTP FS.',
    );
    this.messagesErrChannel = vscode.window.createOutputChannel('SFTP FS - Errors');
    this.messagesErrChannel.appendLine(
      'This output channel will contain error messages related to SFTP FS.',
    );
  }

  appendLineToMessages(prefix: string, content: string) {
    const timeFormat = new Date().toISOString().replace('T', ' ').replace('Z', '');
    const line = timeFormat + ' [' + prefix + '] ' + content;
    console.info(line);
    this.messagesChannel.appendLine(line);
  }

  appendErrorToMessages(prefix: string, usefulMessage: string, error: Error) {
    const timeFormat = new Date().toISOString().replace('T', ' ').replace('Z', '');
    const line =
      timeFormat +
      ' [' +
      prefix +
      '] ' +
      usefulMessage +
      ': (' +
      error.message +
      '): ' +
      error.stack;
    console.error(line);
    this.messagesErrChannel.appendLine(line);
  }
}

export class ScopedLogger {
  constructor(public prefix: string) {}

  logMessage(content: string) {
    SFTPExtension.instance?.logger.appendLineToMessages(this.prefix, content);
  }

  logError(usefulMessage: string, error: Error) {
    SFTPExtension.instance?.logger.appendErrorToMessages(this.prefix, usefulMessage, error);
  }
}
