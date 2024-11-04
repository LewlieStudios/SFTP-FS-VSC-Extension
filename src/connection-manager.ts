import Client from 'ssh2-sftp-client';
import { SFTPWrapper } from 'ssh2';
import { RemoteConfiguration } from './configuration';
import { Pool, PoolFactory } from 'lightning-pool';
import logger from './logger';
import { workspace } from 'vscode';

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

	async reconnect() {
    for (const connection of this.openConnections) {
      await connection[1].reconnect();
    }
	}
}

export interface SFTPConnectionOpen {
  remoteName: string,
  configuration: RemoteConfiguration
}

export class ResourcedPool {
  private heavyPool!: Pool<ConnectionProvider>;
  private passivePool!: Pool<ConnectionProvider>;
  private poolPromise: Promise<void>;
  private passiveFactory: PoolFactory<ConnectionProvider>;
  private heavyFactory: PoolFactory<ConnectionProvider>;

  remoteName: string;
  configuration: RemoteConfiguration;

  constructor(openConfiguration: SFTPConnectionOpen) {
    this.configuration = openConfiguration.configuration;
    this.remoteName = openConfiguration.remoteName;

    this.passiveFactory = {
      create: async function() {
        const client = new Client("sftp-" + openConfiguration.remoteName);
        logger.appendLineToMessages('Connecting to remote SFTP "' + openConfiguration.remoteName + '"....');
        const sftp = await client.connect({ ...openConfiguration.configuration });
        logger.appendLineToMessages('Connection success to remote SFTP "' + openConfiguration.remoteName + '"...');
        const provider = new ConnectionProvider(client, sftp, 'passive');
  
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

    this.heavyFactory = {
      create: async function() {
        const client = new Client("sftp-" + openConfiguration.remoteName);
        logger.appendLineToMessages('Connecting to remote SFTP "' + openConfiguration.remoteName + '"....');
        const sftp = await client.connect({ ...openConfiguration.configuration });
        logger.appendLineToMessages('Connection success to remote SFTP "' + openConfiguration.remoteName + '"...');
        const provider = new ConnectionProvider(client, sftp, 'heavy');
  
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

    this.poolPromise = new Promise(async (resolve, reject) => {
      try {
        await this.setupPool();
        resolve();
      } catch(ex: any) {
        reject(ex);
      }
    });
  }

  async close() {
    await this.heavyPool.closeAsync();
  }

  async getPool(type: PoolType) {
    // We need await pool to finish...
    await this.poolPromise;
    // Get by type
    return type === 'passive' ? this.passivePool : this.heavyPool;
  }

  async reconnect() {
    this.poolPromise = new Promise(async (resolve, reject) => {
      try {
        logger.appendLineToMessages('Performing reconnection...');
        await this.passivePool.closeAsync(true);
        await this.setupPool();
        resolve();
      } catch(ex: any) {
        logger.appendErrorToMessages('Failed to reconnect: ', ex);
        reject(ex);
      }
    });
  }

  async setupPool() {
    const heavyConfig = workspace.getConfiguration('sftpfs.pool.heavy');

    const heavyMax = heavyConfig.get('max', 15);
    const heavyMin = heavyConfig.get('min', 5);
    const heavyMinIdle = heavyConfig.get('minIdle', 6);
    const heavyMaxQueue = heavyConfig.get('maxQueue', 1000000);
    const heavyIdleTimeoutMillis = heavyConfig.get('idleTimeoutMillis', 60000);

    const passiveConfig = workspace.getConfiguration('sftpfs.pool.passive');

    const passiveMax = passiveConfig.get('max', 5);
    const passiveMin = passiveConfig.get('min', 3);
    const passiveMinIdle = passiveConfig.get('minIdle', 3);
    const passiveMaxQueue = passiveConfig.get('maxQueue', 1000000);
    const passiveIdleTimeoutMillis = passiveConfig.get('idleTimeoutMillis', 60000);

    logger.appendLineToMessages('[pool-config] heavy.max = ' + heavyMax);
    logger.appendLineToMessages('[pool-config] heavy.min = ' + heavyMin);
    logger.appendLineToMessages('[pool-config] heavy.minIdle = ' + heavyMinIdle);
    logger.appendLineToMessages('[pool-config] heavy.maxQueue = ' + heavyMaxQueue);
    logger.appendLineToMessages('[pool-config] heavy.idleTimeoutMillis = ' + heavyIdleTimeoutMillis);

    logger.appendLineToMessages('[pool-config] passive.max = ' + passiveMax);
    logger.appendLineToMessages('[pool-config] passive.min = ' + passiveMin);
    logger.appendLineToMessages('[pool-config] passive.minIdle = ' + passiveMinIdle);
    logger.appendLineToMessages('[pool-config] passive.maxQueue = ' + passiveMaxQueue);
    logger.appendLineToMessages('[pool-config] passive.idleTimeoutMillis = ' + passiveIdleTimeoutMillis);

    this.heavyPool = new Pool(this.heavyFactory, {  
      max: heavyMax,    // maximum size of the pool
      min: heavyMin,     // minimum size of the pool
      minIdle: heavyMinIdle,  // minimum idle resources
      maxQueue: heavyMaxQueue, // Unlimited pool...
      idleTimeoutMillis: heavyIdleTimeoutMillis,
    });

    this.passivePool = new Pool(this.passiveFactory, {  
      max: passiveMax,    // maximum size of the pool
      min: passiveMin,     // minimum size of the pool
      minIdle: passiveMinIdle,  // minimum idle resources
      maxQueue: passiveMaxQueue, // Unlimited pool...
      idleTimeoutMillis: passiveIdleTimeoutMillis,
    });
  }

}

export type PoolType = 'passive' | 'heavy'

export class ConnectionProvider {
  private client: Client;
  private sftp: SFTPWrapper;
  type: PoolType;
  status: ConnectionStatus = 'OPENING';

  constructor(client: Client, sftp: SFTPWrapper, type: PoolType) {
    this.client = client;
    this.sftp = sftp;
    this.type = type;
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