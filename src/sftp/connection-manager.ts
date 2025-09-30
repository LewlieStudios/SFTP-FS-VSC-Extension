import Client from 'ssh2-sftp-client';
import { SFTPWrapper } from 'ssh2';
import { RemoteConfiguration } from '../base/configuration.js';
import { Pool, PoolFactory } from 'lightning-pool';
import { workspace } from 'vscode';
import { SFTPExtension } from '../base/vscode-extension.js';

export class ConnectionManager {
  private openConnections: Map<string, ResourcedPool> = new Map();

  constructor(private extension: SFTPExtension) {}

  async createPool(openConfiguration: SFTPConnectionOpen, testSuite: boolean = false) {
    this.extension.logger.appendLineToMessages('Created connection pool for remote "' + openConfiguration.remoteName + '".');
    const pool = new ResourcedPool(this.extension, openConfiguration, testSuite);
    this.openConnections.set(openConfiguration.remoteName, pool);
  }

  poolExists(remoteName: string) {
    return this.openConnections.has(remoteName);
  }

  get(remoteName: string) {
    const pool = this.openConnections.get(remoteName);
    if (pool !== undefined && pool.terminated) {
      throw Error('Pool is terminated');
    }
    return pool;
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

  terminated = false;

  remoteName: string;
  configuration: RemoteConfiguration;

  testSuiteHeavyPoolMax: number = -1;
  testSuiteHeavyPoolMin: number = -1;
  testSuiteHeavyPoolMinIdle: number = -1;
  testSuiteHeavyPoolMaxQueue: number = -1;
  testSuiteHeavyPoolIdleTimeoutMillis: number = -1;

  testSuitePassivePoolMax: number = -1;
  testSuitePassivePoolMin: number = -1;
  testSuitePassivePoolMinIdle: number = -1;
  testSuitePassivePoolMaxQueue: number = -1;
  testSuitePassivePoolIdleTimeoutMillis: number = -1;

  constructor(private extension: SFTPExtension, openConfiguration: SFTPConnectionOpen, testSuite: boolean = false) {
    this.configuration = openConfiguration.configuration;
    this.remoteName = openConfiguration.remoteName;

    this.passiveFactory = {
      create: async function() {
        const client = new Client("sftp-" + openConfiguration.remoteName);
        extension.logger.appendLineToMessages('[connection] [task] Connecting to remote SFTP "' + openConfiguration.remoteName + '"....');
        const sftp = await client.connect({ ...openConfiguration.configuration });
        extension.logger.appendLineToMessages('[connection] [task] Connection success to remote SFTP "' + openConfiguration.remoteName + '"...');
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
        extension.logger.appendLineToMessages('[connection] [task] Destroying connection for remote SFTP "' + openConfiguration.remoteName + '"...');
        provider.getSFTP().end();
      },
      validate: async function(provider) {
        if (provider.status === 'CLOSED') {
          throw Error('SFTP already closed.');
        }

        if (!provider.requiresValidation()) {
          return;
        }

        extension.logger.appendLineToMessages('[connection] [task] Validating connection for "' + openConfiguration.remoteName + '"...');
        const start = Date.now();

        await new Promise<void>((resolve, reject) => {
          provider.getSFTP().stat('/', (err) => {
            if (err) {
              reject(err);
              return;
            }

            resolve();
          });
        });

        const end = Date.now() - start;

        provider.lastValidation = Date.now();
        extension.logger.appendLineToMessages('[connection] [task] Validated connection for "' + openConfiguration.remoteName + '" in ' + end + 'ms...');
  
        provider.getSFTP();
      }
    };

    this.heavyFactory = {
      create: async function() {
        const client = new Client("sftp-" + openConfiguration.remoteName);
        extension.logger.appendLineToMessages('[connection] [task] Connecting to remote SFTP "' + openConfiguration.remoteName + '"....');
        const sftp = await client.connect({ ...openConfiguration.configuration });
        extension.logger.appendLineToMessages('[connection] [task] Connection success to remote SFTP "' + openConfiguration.remoteName + '"...');
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
        extension.logger.appendLineToMessages('[connection] [task] Destroying connection for remote SFTP "' + openConfiguration.remoteName + '"...');
        provider.getSFTP().end();
      },
      validate: async function(provider) {
        if (provider.status === 'CLOSED') {
          throw Error('SFTP already closed.');
        }

        extension.logger.appendLineToMessages('[connection] [task] Validating connection for "' + openConfiguration.remoteName + '"...');

        await new Promise<void>((resolve, reject) => {
          provider.getSFTP().stat('/', (err) => {
            if (err) {
              reject(err);
              return;
            }

            resolve();
          });
        });

        extension.logger.appendLineToMessages('[connection] [task] Validated connection for "' + openConfiguration.remoteName + '"...');

        provider.getSFTP();
      }
    };

    this.poolPromise = new Promise(async (resolve, reject) => {
      try {
        await this.setupPool(testSuite);
        resolve();
      } catch(ex: any) {
        reject(ex);
      }
    });
  }

  async close() {
    this.terminated = true;
    await this.passivePool.closeAsync(true);
    await this.heavyPool.closeAsync(true);
  }

  async getPool(type: PoolType) {
    if (this.terminated) {
      throw Error('Pool terminated.');
    }
    // We need await pool to finish...
    await this.poolPromise;
    // Get by type
    return type === 'passive' ? this.passivePool : this.heavyPool;
  }

  async reconnect() {
    this.poolPromise = new Promise(async (resolve, reject) => {
      try {
        this.extension.logger.appendLineToMessages('[pool] [task] Performing reconnection...');
        this.terminated = true;
        await this.passivePool.closeAsync(true);
        await this.heavyPool.closeAsync(true);
        await this.setupPool();
        this.terminated = false;
        resolve();
      } catch(ex: any) {
        this.extension.logger.appendErrorToMessages('reconnect', 'Failed to reconnect: ', ex);
        reject(ex);
      }
    });
  }

  async setupPool(testSuite: boolean = false) {
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

    this.extension.logger.appendLineToMessages('[pool-config] heavy.max = ' + heavyMax);
    this.extension.logger.appendLineToMessages('[pool-config] heavy.min = ' + heavyMin);
    this.extension.logger.appendLineToMessages('[pool-config] heavy.minIdle = ' + heavyMinIdle);
    this.extension.logger.appendLineToMessages('[pool-config] heavy.maxQueue = ' + heavyMaxQueue);
    this.extension.logger.appendLineToMessages('[pool-config] heavy.idleTimeoutMillis = ' + heavyIdleTimeoutMillis);

    this.testSuiteHeavyPoolMax = heavyMax;
    this.testSuiteHeavyPoolMin = heavyMin;
    this.testSuiteHeavyPoolMinIdle = heavyMinIdle;
    this.testSuiteHeavyPoolMaxQueue = heavyMaxQueue;
    this.testSuiteHeavyPoolIdleTimeoutMillis = heavyIdleTimeoutMillis;

    this.extension.logger.appendLineToMessages('[pool-config] passive.max = ' + passiveMax);
    this.extension.logger.appendLineToMessages('[pool-config] passive.min = ' + passiveMin);
    this.extension.logger.appendLineToMessages('[pool-config] passive.minIdle = ' + passiveMinIdle);
    this.extension.logger.appendLineToMessages('[pool-config] passive.maxQueue = ' + passiveMaxQueue);
    this.extension.logger.appendLineToMessages('[pool-config] passive.idleTimeoutMillis = ' + passiveIdleTimeoutMillis);

    this.testSuitePassivePoolMax = passiveMax;
    this.testSuitePassivePoolMin = passiveMin;
    this.testSuitePassivePoolMinIdle = passiveMinIdle;
    this.testSuitePassivePoolMaxQueue = passiveMaxQueue;
    this.testSuitePassivePoolIdleTimeoutMillis = passiveIdleTimeoutMillis;

    this.extension.logger.appendLineToMessages('[pool-config] targetHost = ' + this.configuration.host);
    this.extension.logger.appendLineToMessages('[pool-config] targetPort = ' + this.configuration.port);
    this.extension.logger.appendLineToMessages('[pool-config] targetUser = ' + this.configuration.username);

    if (!testSuite) {
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
    } else {
      console.info('Skip pool creation due test suite.');
    }
  }

}

export type PoolType = 'passive' | 'heavy'

export class ConnectionProvider {
  private client: Client;
  private sftp: SFTPWrapper;
  type: PoolType;
  status: ConnectionStatus = 'OPENING';
  lastValidation: number = Date.now();

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

  requiresValidation() {
    // More than 60s, then should ve validated...
    return Date.now() - this.lastValidation >= 60_000;
  }
}

export type ConnectionStatus = 'OPEN' | 'OPENING' | 'CLOSED'
