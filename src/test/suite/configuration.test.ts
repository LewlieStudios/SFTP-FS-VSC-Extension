import * as assert from 'assert';
import * as vscode from 'vscode';
import * as mocha from 'mocha';
import { Configuration } from '../../base/configuration';
import { GlobalLogger } from '../../base/logger';
import { SFTPConnectionManager } from '../../sftp/connection-manager';
import { SFTPExtension } from '../../base/vscode-extension';

mocha.suite('Configuration Test Suite', () => {
  // Minimal mock for vscode.ExtensionContext
  const mockExtensionContext: vscode.ExtensionContext = {
    subscriptions: [],
    workspaceState: {
      get: () => undefined,
      update: async () => {},
    },
    globalState: {
      get: () => undefined,
      update: async () => {},
      setKeysForSync: () => {},
    },
    extensionPath: '',
    asAbsolutePath: (relativePath: string) => relativePath,
    storagePath: '',
    globalStoragePath: '',
    logPath: '',
    extensionUri: vscode.Uri.parse(''),
    environmentVariableCollection: {
      persistent: true,
      replace: () => {},
      append: () => {},
      prepend: () => {},
      get: () => undefined,
      forEach: () => {},
      clear: () => {},
      delete: () => {},
      getScoped: () => undefined,
    },
    secrets: {
      store: async () => {},
      get: async () => undefined,
      delete: async () => {},
      onDidChange: { event: () => {} },
    },
  } as any;
  const extension = new SFTPExtension(mockExtensionContext);
  const configuration = new Configuration();
  const logger = new GlobalLogger();
  const connectionManager = new SFTPConnectionManager(extension);
  extension.logger = logger;

  mocha.before(async () => {
    console.log('Generating a default configuration...');
    await vscode.workspace
      .getConfiguration('sftpfs.cache.metadata.files')
      .update('seconds', 10, true);
    await vscode.workspace
      .getConfiguration('sftpfs.behavior.notification.upload')
      .update('fileSize', 1024, true);
    await vscode.workspace
      .getConfiguration('sftpfs.behavior.notification.download')
      .update('fileSize', 2056, true);
    await vscode.workspace.getConfiguration('sftpfs').update(
      'remotes',
      {
        'test-suite': {
          host: 'localhost',
          port: 55,
          username: 'test-suite',
          password: 'not-valid',
          remotePath: '/',
        },
      },
      true,
    );
    await vscode.workspace.getConfiguration('sftpfs.pool.heavy').update('max', 20, true);
    await vscode.workspace.getConfiguration('sftpfs.pool.heavy').update('min', 3, true);
    await vscode.workspace.getConfiguration('sftpfs.pool.heavy').update('minIdle', 2, true);
    await vscode.workspace.getConfiguration('sftpfs.pool.heavy').update('maxQueue', 5000, true);
    await vscode.workspace
      .getConfiguration('sftpfs.pool.heavy')
      .update('idleTimeoutMillis', 10000, true);
    await vscode.workspace.getConfiguration('sftpfs.pool.passive').update('max', 10, true);
    await vscode.workspace.getConfiguration('sftpfs.pool.passive').update('min', 5, true);
    await vscode.workspace.getConfiguration('sftpfs.pool.passive').update('minIdle', 1, true);
    await vscode.workspace.getConfiguration('sftpfs.pool.passive').update('maxQueue', 6000, true);
    await vscode.workspace
      .getConfiguration('sftpfs.pool.passive')
      .update('idleTimeoutMillis', 20000, true);

    console.info('Logger setup.');
    logger.init();
  });

  mocha.test('Test General Configuration Load', async () => {
    assert.strictEqual(
      configuration.getBehaviorNotificationDownloadKB(),
      2056,
      'configuration.getBehaviorNotificationDownloadKB()',
    );
    assert.strictEqual(
      configuration.getBehaviorNotificationUploadKB(),
      1024,
      'configuration.getBehaviorNotificationUploadKB()',
    );
    assert.strictEqual(
      configuration.getCacheMetadataTimeToKeep(),
      10,
      'configuration.getCacheMetadataTimeToKeep()',
    );
  });

  mocha.test('Test Remote Configuration Save', async () => {
    await configuration.saveRemoteConfiguration(
      'test',
      'localhost-fake',
      33,
      'test-user',
      '/',
      'dummy',
    );
    assert.strictEqual(
      configuration.getRemotesConfigurationNames().length,
      2,
      'Length of remotes configuration names',
    );
    assert.strictEqual(
      configuration.getRemotesConfigurationNames()[0],
      'test-suite',
      'Remote name #1 should be test-suite.',
    );
    assert.strictEqual(
      configuration.getRemotesConfigurationNames()[1],
      'test',
      'Remote name #2 should be test.',
    );
    assert.strictEqual(
      configuration.getRemoteConfiguration('test')?.host,
      'localhost-fake',
      "Evaluating 'host' of remote 'test'",
    );
    assert.strictEqual(
      configuration.getRemoteConfiguration('test')?.port,
      33,
      "Evaluating 'port' of remote 'test'",
    );
    assert.strictEqual(
      configuration.getRemoteConfiguration('test')?.username,
      'test-user',
      "Evaluating 'username' of remote 'test'",
    );
    assert.strictEqual(
      configuration.getRemoteConfiguration('test')?.remotePath,
      '/',
      "Evaluating 'remotePath' of remote 'test'",
    );
    assert.strictEqual(
      configuration.getRemoteConfiguration('test')?.password,
      'dummy',
      "Evaluating 'password' of remote 'test'",
    );
  });

  mocha.test('Test Remote Configuration Deletion', async () => {
    await configuration.removeRemoteConfiguration(['test-fake-not-exist']);
    assert.strictEqual(
      configuration.getRemotesConfigurationNames().length,
      2,
      'Length of remotes configuration names should be 2',
    );
    assert.strictEqual(
      configuration.getRemotesConfigurationNames()[0],
      'test-suite',
      'Remote name #1 should be test-suite.',
    );
    assert.strictEqual(
      configuration.getRemotesConfigurationNames()[1],
      'test',
      'Remote name #2 should be test.',
    );
    await configuration.removeRemoteConfiguration(['test-suite']);
    assert.strictEqual(
      configuration.getRemotesConfigurationNames().length,
      1,
      'Length of remotes configuration names should be 1',
    );
    assert.strictEqual(
      configuration.getRemotesConfigurationNames()[0],
      'test',
      'Remote name #1 should be test.',
    );
    await configuration.removeRemoteConfiguration(['test']);
    assert.strictEqual(
      configuration.getRemotesConfigurationNames().length,
      0,
      'Length of remotes configuration names should be 0',
    );
  });

  mocha.test('Test Pool Configuration Load', async () => {
    await connectionManager.createResourceManager(
      {
        configuration: {
          host: 'dummy',
          port: 22,
          username: 'dummy-user',
          password: 'dummy-pass',
        },
        remoteName: 'dummy-remote',
      },
      true,
    );

    const pool = connectionManager.getResourceManager('dummy-remote')!;
    assert.strictEqual(pool.testSuiteHeavyPoolMax, 20, 'Heavy Pool - option "max" evaluation.');
    assert.strictEqual(pool.testSuiteHeavyPoolMin, 3, 'Heavy Pool - option "min" evaluation.');
    assert.strictEqual(
      pool.testSuiteHeavyPoolMinIdle,
      2,
      'Heavy Pool - option "minIdle" evaluation.',
    );
    assert.strictEqual(
      pool.testSuiteHeavyPoolMaxQueue,
      5000,
      'Heavy Pool - option "maxQueue" evaluation.',
    );
    assert.strictEqual(
      pool.testSuiteHeavyPoolIdleTimeoutMillis,
      10000,
      'Heavy Pool - option "idleTimeoutMillis" evaluation.',
    );
    assert.strictEqual(pool.testSuitePassivePoolMax, 10, 'Passive Pool - option "max" evaluation.');
    assert.strictEqual(pool.testSuitePassivePoolMin, 5, 'Passive Pool - option "min" evaluation.');
    assert.strictEqual(
      pool.testSuitePassivePoolMinIdle,
      1,
      'Passive Pool - option "minIdle" evaluation.',
    );
    assert.strictEqual(
      pool.testSuitePassivePoolMaxQueue,
      6000,
      'Passive Pool - option "maxQueue" evaluation.',
    );
    assert.strictEqual(
      pool.testSuitePassivePoolIdleTimeoutMillis,
      20000,
      'Passive Pool - option "idleTimeoutMillis" evaluation.',
    );
  });
});
