import Client from 'ssh2-sftp-client';
import { SFTPWrapper } from 'ssh2';
import { RemoteConfiguration } from './configuration';
import { Pool, PoolFactory } from 'lightning-pool';
import logger from './logger';

export class ConnectionManager {
  private openConnections: Map<string, ResourcedPool> = new Map();

  async createPool(openConfiguration: SFTPConnectionOpen) {
    logger.appendLineToMessages('Created connection pool for remote "' + openConfiguration.remoteName + '".');
    const pool = new ResourcedPool(openConfiguration);
    this.openConnections.set(openConfiguration.remoteName, pool);
  }

  poolExists(remoteName: string) {
    return this.openConnections.has(remoteName);
  }

  get(remoteName: string) {
    return this.openConnections.get(remoteName);
  }

  async destroyAll() {
    for (const entry of this.openConnections) {
      const pool = entry[1];
      await pool.close();
    }
  }
}

export interface SFTPConnectionOpen {
  remoteName: string,
  configuration: RemoteConfiguration
}

export class ResourcedPool {

  private pool: Pool<ConnectionProvider>;
  remoteName: string;
  configuration: RemoteConfiguration;

  constructor(openConfiguration: SFTPConnectionOpen) {
    this.configuration = openConfiguration.configuration;
    this.remoteName = openConfiguration.remoteName;

    const factory: PoolFactory<ConnectionProvider> = {
      create: async function() {
        const client = new Client("sftp-" + openConfiguration.remoteName);
        logger.appendLineToMessages('Connecting to remote SFTP "' + openConfiguration.remoteName + '"....');
        const sftp = await client.connect({ ...openConfiguration.configuration });
        logger.appendLineToMessages('Connection success to remote SFTP "' + openConfiguration.remoteName + '"...');
        const provider = new ConnectionProvider(client, sftp);

        client.on('close', () => {
          provider.status = 'CLOSED';
        });
        client.on('error', () => {
          provider.status = 'CLOSED';
        });
        client.on('end', () => {
          provider.status = 'CLOSED';
        });
        sftp.on('error', () => {
          provider.status = 'CLOSED';
        });
        sftp.on('CLOSE', () => {
          provider.status = 'CLOSED';
        });
        sftp.on('close', () => {
          provider.status = 'CLOSED';
        });
        sftp.on('end', () => {
          provider.status = 'CLOSED';
        });

        return provider;
      },
      destroy: async function(provider) {  
        logger.appendLineToMessages('Destroying connection for remote SFTP "' + openConfiguration.remoteName + '"...');
        provider.getSFTP().end();
      },
      validate: async function(provider) {
        if (provider.status === 'CLOSED') {
          throw Error('SFTP already closed.');
        }

        provider.getSFTP();
      }
    };

    this.pool = new Pool(factory, {  
      max: 15,    // maximum size of the pool
      min: 5,     // minimum size of the pool
      minIdle: 5,  // minimum idle resources
      
    });
  }

  async close() {
    await this.pool.closeAsync();
  }

  getPool() {
    return this.pool;
  }

}

export class ConnectionProvider {
  private client: Client;
  private sftp: SFTPWrapper;
  status: ConnectionStatus = 'OPENING';

  constructor(client: Client, sftp: SFTPWrapper) {
    this.client = client;
    this.sftp = sftp;
  }

  getSFTP() {
    if (this.status === 'CLOSED') {
      throw Error('SFTP already closed');
    }
    return this.sftp;
  }
}

export type ConnectionStatus = 'OPEN' | 'OPENING' | 'CLOSED'

const connectionManager = new ConnectionManager();
export default connectionManager;