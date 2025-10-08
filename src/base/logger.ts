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
    console.info(content);
    this.messagesChannel.appendLine('[' + prefix + '] ' + content);
  }

  appendErrorToMessages(prefix: string, usefulMessage: string, error: Error) {
    console.error(
      '[' +
        prefix +
        '] An error occurred: ' +
        usefulMessage +
        ': (' +
        error.message +
        '): ' +
        error.stack,
    );
    this.messagesErrChannel.appendLine(
      '[' + prefix + '] ' + usefulMessage + ': (' + error.message + '): ' + error.stack,
    );
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
