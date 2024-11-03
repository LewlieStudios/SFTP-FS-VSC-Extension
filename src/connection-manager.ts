import Client from 'ssh2-sftp-client';
import { SFTPWrapper } from 'ssh2';
import { RemoteConfiguration } from './configuration';
import * as vscode from 'vscode';
import logger from './logger';
import { v4 as uuidv4 } from 'uuid';
import { Pool, PoolFactory } from 'lightning-pool';

export class ConnectionManager {
  private openConnections: Map<string, SFTPConnection> = new Map();

  isConnectionOpen(remoteName: string) {
    return this.openConnections.has(remoteName) && this.openConnections.get(remoteName)!.status !== 'CLOSED';
  }

  getConnection(remoteName: string) {
    return this.openConnections.get(remoteName);
  }

  async getConnectionAndTryRestablish(remoteName: string) {
    if (!this.isConnectionOpen(remoteName)) {
      logger.appendLineToMessages('Connection to SFTP ("' + remoteName + '") is not open, trying to connect...');
      const connection = this.getConnection(remoteName);
      if (connection === undefined) {
        logger.appendLineToMessages('Connection to SFTP ("' + remoteName + '") cannot be stablished: no connection present');
        return undefined;
      }

      await connectionManager.connect({
          configuration: connection.configuration,
          remoteName: connection.remoteName
      });
      logger.appendLineToMessages('Connection to SFTP ("' + remoteName + '") success');
    } else {
      return this.getConnection(remoteName)!;
    }
  }

  async connect(openConfiguration: SFTPConnectionOpen) {
    const connection: SFTPConnection = {
      ...openConfiguration,
      client: new Client("sftp-" + openConfiguration.remoteName),
      status: 'OPENING',
      uuid: uuidv4()
    };

    const old = this.openConnections.get(connection.remoteName);
    this.updateConnection(connection);
    if (old !== undefined) {
      await this.closePreviousIfOpen(old);
    }
    await this.startConnection(connection);
  }

  async destroyAll() {
    for (const entry of this.openConnections) {
      const sftpConnection = entry[1];
      try {
        logger.appendLineToMessages('Closing SFTP connection for remote "' + sftpConnection.remoteName + '".');
        await sftpConnection.client!.end();
        logger.appendLineToMessages('SFTP connection for remote "' + sftpConnection.remoteName + '" ended successfully.');
      } catch(ex: any) {
        logger.appendErrorToMessages('Failed to end SFTP connection for remote "' + sftpConnection.remoteName + '".', ex);
      }
    }
  }

  private async closePreviousIfOpen(connection: SFTPConnection) {
    if (connection.status !== 'CLOSED') {
      // close connection
      logger.appendLineToMessages('Closing SFTP connection for remote "' + connection.remoteName + '".');
      await connection.client.end();
    }
  }

  private updateConnection(connection: SFTPConnection) {
    this.openConnections.set(connection.remoteName, connection);
  }

  private async startConnection(connection: SFTPConnection) {
    logger.appendLineToMessages('Starting SFTP connection for remote "' + connection.remoteName + '".');
    const uuid = connection.uuid;
    try {
      const wrapper = await connection.client.connect({ ...connection.configuration });
      wrapper.on('close', () => {
        // close
        const currentConnection = this.getConnection(connection.remoteName);
        if (currentConnection?.uuid === uuid) {
          logger.appendLineToMessages('Remote connection "' + connection.remoteName + '" closed, marked connection as CLOSED.');
          currentConnection.status = 'CLOSED';
        } else {
          logger.appendLineToMessages('Remote connection "' + connection.remoteName + '" closed.');
        }
      });
      this.updateConnection({
        ...connection,
        status: 'CONNECTED',
        sftp: wrapper
      });
      logger.appendLineToMessages('SFTP connection for remote "' + connection.remoteName + '" stablished.');
      vscode.window.setStatusBarMessage('Connection success to remote "' + connection.remoteName + '"!', 10000);
    } catch(ex: any) {;
      logger.appendErrorToMessages('Failed to stablish connection to remote "' + connection.configuration + '"', ex);
      vscode.window.showErrorMessage('Failed to stablish connection.');
      this.updateConnection({
        ...connection,
        status: 'CLOSED'
      });
    }
  }
}

export interface SFTPConnectionOpen {
  remoteName: string,
  configuration: RemoteConfiguration
}

export interface SFTPConnection {
  remoteName: string,
  client: Client,
  sftp?: SFTPWrapper,
  status: ConnectionStatus,
  configuration: RemoteConfiguration,
  uuid: string
}

export type ConnectionStatus = 'CONNECTED' | 'CLOSED' | 'OPENING'

export class ResourcedPool {

  configuration: SFTPConnectionOpen;

  pool: Pool<SFTPConnection>;

  constructor(openConfiguration: SFTPConnectionOpen) {
    this.configuration = openConfiguration;

    const factory: PoolFactory<SFTPConnection> = {
      create: async function(opts) {
          const connection: SFTPConnection = {
            ...openConfiguration,
            client: new Client("sftp-" + openConfiguration.remoteName),
            uuid: uuidv4()
          };
          return client;
      },
      destroy: async function(client) {  
         await client.close();       
      },
      reset: async function(client){   
         await client.rollback();       
      },
      validate: async function(client) {
         await client.query('select 1');       
      }    
    };

    this.pool = new Pool(this.factory, {  
      max: 10,    // maximum size of the pool
      min: 2,     // minimum size of the pool
      minIdle: 2  // minimum idle resources
    });
  }

}





const connectionManager = new ConnectionManager();
export default connectionManager;