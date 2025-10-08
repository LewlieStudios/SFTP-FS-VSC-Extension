import Client from 'ssh2-sftp-client';
import { SFTPWrapper } from 'ssh2';
import { RemoteConfiguration } from '../base/configuration.js';
import { Pool, PoolFactory } from 'lightning-pool';
import { workspace } from 'vscode';
import { SFTPExtension } from '../base/vscode-extension.js';
import { Subject } from 'rxjs';
import { ScopedLogger } from '../base/logger.js';

export class SFTPConnectionManager {
  private activeSftpResourceManagers: Map<string, SFTPResourceManager> = new Map();
  private logger: ScopedLogger = new ScopedLogger('ConnectionManager');

  constructor(private extension: SFTPExtension) {}

  async createResourceManager(
    openConfiguration: SFTPRuntimeConfiguration,
    testSuite: boolean = false,
  ) {
    this.logger.logMessage(
      'Created connection pool for remote "' + openConfiguration.remoteName + '".',
    );
    const pool = new SFTPResourceManager(this.extension, openConfiguration, testSuite);
    this.activeSftpResourceManagers.set(openConfiguration.remoteName, pool);
  }

  hasActiveResourceManager(remoteName: string) {
    return this.activeSftpResourceManagers.has(remoteName);
  }

  getResourceManager(remoteName: string) {
    const pool = this.activeSftpResourceManagers.get(remoteName);
    if (pool !== undefined && pool.terminated) {
      throw Error('Pool is terminated');
    }
    return pool;
  }

  async destroyResourceManager(remoteName: string) {
    if (!this.hasActiveResourceManager(remoteName)) {
      return;
    }

    const pool = this.activeSftpResourceManagers.get(remoteName);
    if (pool !== undefined) {
      this.activeSftpResourceManagers.delete(remoteName);
      try {
        await pool.close();
      } catch (ex: any) {
        this.logger.logError('Failed to close pool for remote "' + remoteName + '": ', ex);
      }
    }
  }

  async destroyAll() {
    for (const connection of this.activeSftpResourceManagers.values()) {
      await connection.close();
    }
  }

  async reconnect() {
    for (const connection of this.activeSftpResourceManagers.values()) {
      await connection.reconnect();
    }
  }
}

export interface SFTPRuntimeConfiguration {
  remoteName: string;
  configuration: RemoteConfiguration;
}

export class SFTPResourceManager {
  private heavyPool!: Pool<SFTPClientHandler>;
  private passivePool!: Pool<SFTPClientHandler>;

  heavyPoolChange: Subject<void> = new Subject<void>();
  passivePoolChange: Subject<void> = new Subject<void>();
  poolChange: Subject<void> = new Subject<void>();

  private passiveFactory: PoolFactory<SFTPClientHandler>;
  private heavyFactory: PoolFactory<SFTPClientHandler>;

  private poolPromise: Promise<void>;

  terminated = false;

  remoteName: string;
  configuration: RemoteConfiguration;

  // TODO: May be there is a way to avoid this...
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

  logger: ScopedLogger;

  constructor(
    private extension: SFTPExtension,
    runtimeConfiguration: SFTPRuntimeConfiguration,
    testSuite: boolean = false,
  ) {
    this.configuration = runtimeConfiguration.configuration;
    this.remoteName = runtimeConfiguration.remoteName;
    const logger = new ScopedLogger('ResourceManager-' + this.remoteName);
    this.logger = logger;

    this.passiveFactory = {
      create: async function () {
        const client = new Client('sftp-' + runtimeConfiguration.remoteName);
        logger.logMessage(
          '[connection] [task] Connecting to remote SFTP "' +
            runtimeConfiguration.remoteName +
            '"....',
        );
        const sftp = await client.connect({ ...runtimeConfiguration.configuration });
        logger.logMessage(
          '[connection] [task] Connection success to remote SFTP "' +
            runtimeConfiguration.remoteName +
            '"...',
        );
        const provider = new SFTPClientHandler(client, sftp, 'passive', 'OPEN');

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
      destroy: async function (provider) {
        logger.logMessage(
          '[connection] [task] Destroying connection for remote SFTP "' +
            runtimeConfiguration.remoteName +
            '"...',
        );
        provider.getSFTP().end();
      },
      validate: async function (provider) {
        if (provider.status === 'CLOSED') {
          throw Error('SFTP already closed.');
        }

        if (!provider.requiresValidation()) {
          return;
        }

        logger.logMessage(
          '[connection] [task] Validating connection for "' +
            runtimeConfiguration.remoteName +
            '"...',
        );
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
        logger.logMessage(
          '[connection] [task] Validated connection for "' +
            runtimeConfiguration.remoteName +
            '" in ' +
            end +
            'ms...',
        );

        provider.getSFTP();
      },
    };

    this.heavyFactory = {
      create: async function () {
        const client = new Client('sftp-' + runtimeConfiguration.remoteName);
        logger.logMessage(
          '[connection] [task] Connecting to remote SFTP "' +
            runtimeConfiguration.remoteName +
            '"....',
        );
        const sftp = await client.connect({ ...runtimeConfiguration.configuration });
        logger.logMessage(
          '[connection] [task] Connection success to remote SFTP "' +
            runtimeConfiguration.remoteName +
            '"...',
        );
        const provider = new SFTPClientHandler(client, sftp, 'heavy', 'OPEN');

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
      destroy: async function (provider) {
        logger.logMessage(
          '[connection] [task] Destroying connection for remote SFTP "' +
            runtimeConfiguration.remoteName +
            '"...',
        );
        provider.getSFTP().end();
      },
      validate: async function (provider) {
        if (provider.status === 'CLOSED') {
          throw Error('SFTP already closed.');
        }

        logger.logMessage(
          '[connection] [task] Validating connection for "' +
            runtimeConfiguration.remoteName +
            '"...',
        );

        await new Promise<void>((resolve, reject) => {
          provider.getSFTP().stat('/', (err) => {
            if (err) {
              reject(err);
              return;
            }

            resolve();
          });
        });

        logger.logMessage(
          '[connection] [task] Validated connection for "' +
            runtimeConfiguration.remoteName +
            '"...',
        );

        provider.getSFTP();
      },
    };

    this.poolPromise = new Promise(async (resolve, reject) => {
      try {
        await this.setupPool(testSuite);
        resolve();
      } catch (ex: any) {
        reject(ex);
      }
    });
  }

  async close() {
    this.terminated = true;

    let error1: any = null;
    let error2: any = null;

    try {
      await this.passivePool.closeAsync(true);
    } catch (ex: any) {
      this.logger.logError('Failed to close passive pool: ', ex);
      error1 = ex;
    }

    try {
      await this.heavyPool.closeAsync(true);
    } catch (ex: any) {
      this.logger.logError('Failed to close heavy pool: ', ex);
      error2 = ex;
    }

    this.heavyPoolChange.next();
    this.heavyPoolChange.complete();
    this.passivePoolChange.next();
    this.passivePoolChange.complete();
    this.poolChange.next();
    this.poolChange.complete();

    if (error1 !== null || error2 !== null) {
      throw Error('Failed to close one or more pools.', { cause: [error1, error2] });
    }
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
        this.logger.logMessage('[pool] [task] Performing reconnection...');
        this.terminated = true;
        await this.passivePool.closeAsync(true);
        await this.heavyPool.closeAsync(true);
        await this.setupPool();
        this.terminated = false;
        resolve();
      } catch (ex: any) {
        this.logger.logError('Failed to reconnect: ', ex);
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

    this.logger.logMessage('[pool-config] heavy.max = ' + heavyMax);
    this.logger.logMessage('[pool-config] heavy.min = ' + heavyMin);
    this.logger.logMessage('[pool-config] heavy.minIdle = ' + heavyMinIdle);
    this.logger.logMessage('[pool-config] heavy.maxQueue = ' + heavyMaxQueue);
    this.logger.logMessage('[pool-config] heavy.idleTimeoutMillis = ' + heavyIdleTimeoutMillis);

    this.testSuiteHeavyPoolMax = heavyMax;
    this.testSuiteHeavyPoolMin = heavyMin;
    this.testSuiteHeavyPoolMinIdle = heavyMinIdle;
    this.testSuiteHeavyPoolMaxQueue = heavyMaxQueue;
    this.testSuiteHeavyPoolIdleTimeoutMillis = heavyIdleTimeoutMillis;

    this.logger.logMessage('[pool-config] passive.max = ' + passiveMax);
    this.logger.logMessage('[pool-config] passive.min = ' + passiveMin);
    this.logger.logMessage('[pool-config] passive.minIdle = ' + passiveMinIdle);
    this.logger.logMessage('[pool-config] passive.maxQueue = ' + passiveMaxQueue);
    this.logger.logMessage('[pool-config] passive.idleTimeoutMillis = ' + passiveIdleTimeoutMillis);

    this.testSuitePassivePoolMax = passiveMax;
    this.testSuitePassivePoolMin = passiveMin;
    this.testSuitePassivePoolMinIdle = passiveMinIdle;
    this.testSuitePassivePoolMaxQueue = passiveMaxQueue;
    this.testSuitePassivePoolIdleTimeoutMillis = passiveIdleTimeoutMillis;

    this.logger.logMessage('[pool-config] targetHost = ' + this.configuration.host);
    this.logger.logMessage('[pool-config] targetPort = ' + this.configuration.port);
    this.logger.logMessage('[pool-config] targetUser = ' + this.configuration.username);

    if (!testSuite) {
      this.heavyPool = new Pool(this.heavyFactory, {
        max: heavyMax, // maximum size of the pool
        min: heavyMin, // minimum size of the pool
        minIdle: heavyMinIdle, // minimum idle resources
        maxQueue: heavyMaxQueue, // Unlimited pool...
        idleTimeoutMillis: heavyIdleTimeoutMillis,
      });

      this.heavyPool.on('create', () => {
        this.heavyPoolChange.next();
      });
      this.heavyPool.on('create-error', () => {
        this.heavyPoolChange.next();
      });
      this.heavyPool.on('destroy', () => {
        this.heavyPoolChange.next();
      });
      this.heavyPool.on('destroy-error', () => {
        this.heavyPoolChange.next();
      });
      this.heavyPool.on('close', () => {
        this.heavyPoolChange.next();
      });

      this.passivePool = new Pool(this.passiveFactory, {
        max: passiveMax, // maximum size of the pool
        min: passiveMin, // minimum size of the pool
        minIdle: passiveMinIdle, // minimum idle resources
        maxQueue: passiveMaxQueue, // Unlimited pool...
        idleTimeoutMillis: passiveIdleTimeoutMillis,
      });

      this.passivePool.on('create', () => {
        this.passivePoolChange.next();
      });
      this.passivePool.on('create-error', () => {
        this.passivePoolChange.next();
      });
      this.passivePool.on('destroy', () => {
        this.passivePoolChange.next();
      });
      this.passivePool.on('destroy-error', () => {
        this.passivePoolChange.next();
      });
      this.passivePool.on('close', () => {
        this.passivePoolChange.next();
      });

      this.heavyPoolChange.subscribe(() => {
        this.poolChange.next();
      });
      this.passivePoolChange.subscribe(() => {
        this.poolChange.next();
      });
    } else {
      console.info('Skip pool creation due test suite.');
    }
  }

  getTotalConnections() {
    return this.heavyPool.size + this.passivePool.size;
  }
}

export type PoolType = 'passive' | 'heavy';

export class SFTPClientHandler {
  private client: Client;
  private sftp: SFTPWrapper;
  type: PoolType;
  status: SFTPClientStatus;
  lastValidation: number = Date.now();

  constructor(client: Client, sftp: SFTPWrapper, type: PoolType, status: SFTPClientStatus) {
    this.client = client;
    this.sftp = sftp;
    this.type = type;
    this.status = status;
  }

  getSFTP() {
    if (this.status === 'CLOSED') {
      throw Error('SFTP already closed');
    }
    return this.sftp;
  }

  requiresValidation() {
    // More than 60s, then should be validated...
    return Date.now() - this.lastValidation >= 60_000;
  }
}

export type SFTPClientStatus = 'OPEN' | 'CLOSED';
