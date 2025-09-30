import { workspace } from 'vscode';

export class Configuration {
  getRemotesConfiguration() {
    const currentRemotes = workspace
      .getConfiguration('sftpfs')
      .get<RemoteConfigurationSection>('remotes');
    if (currentRemotes === undefined) {
      return {};
    }

    return currentRemotes;
  }

  getRemotesConfigurationNames() {
    return Object.keys(this.getRemotesConfiguration());
  }

  getCacheMetadataTimeToKeep() {
    return workspace.getConfiguration('sftpfs.cache.metadata.files').get('seconds', 30);
  }

  getBehaviorNotificationUploadKB() {
    return workspace.getConfiguration('sftpfs.behavior.notification.upload').get('fileSize', 5120);
  }

  getBehaviorNotificationDownloadKB() {
    return workspace
      .getConfiguration('sftpfs.behavior.notification.download')
      .get('fileSize', 5120);
  }

  async saveRemoteConfiguration(
    name: string,
    host: string,
    port: number,
    username: string,
    remotePath: string,
    password?: string,
  ) {
    const config = this.getRemotesConfiguration();
    config[name.trim().toLowerCase()] = {
      host,
      port,
      username,
      password,
      remotePath,
    };
    await workspace.getConfiguration('sftpfs').update('remotes', config, true);
  }

  async removeRemoteConfiguration(namesToRemove: string[]) {
    const config = this.getRemotesConfiguration();
    const newStorage = Object.keys(config)
      .filter((sKey) => namesToRemove.find((n) => n === sKey) === undefined)
      .reduce((obj: RemoteConfigurationSection, key: string) => {
        obj[key] = config[key];
        return obj;
      }, {} as RemoteConfigurationSection);
    await workspace.getConfiguration('sftpfs').update('remotes', newStorage, true);
  }

  getRemoteConfiguration(name: string) {
    const config = this.getRemotesConfiguration();
    if (!(name in config)) {
      return undefined;
    }
    return config[name];
  }

  getWorkDirForRemote(remoteName: string) {
    const workDirsConfig = workspace
      .getConfiguration('sftpfs')
      .get<WorkDirConfigurationSection>('workDirs');
    if (workDirsConfig === undefined) {
      return undefined;
    }
    if (!(remoteName in workDirsConfig)) {
      return undefined;
    }
    return workDirsConfig[remoteName].workDir;
  }

  async setWorkDirForRemote(remoteName: string, workDir: string) {
    const workDirsConfig =
      workspace.getConfiguration('sftpfs').get<WorkDirConfigurationSection>('workDirs') ?? {};
    const newStorage = Object.keys(workDirsConfig)
      .filter((sKey) => remoteName !== sKey)
      .reduce((obj: WorkDirConfigurationSection, key: string) => {
        obj[key] = workDirsConfig[key];
        return obj;
      }, {} as WorkDirConfigurationSection);
    newStorage[remoteName] = {
      workDir,
    };
    await workspace.getConfiguration('sftpfs').update('workDirs', newStorage, true);
  }
}

export interface RemoteConfigurationSection {
  [key: string]: RemoteConfiguration;
}

export interface RemoteConfiguration {
  host?: string;
  port?: number;
  forceIPv4?: boolean;
  forceIPv6?: boolean;
  username?: string;
  password?: string;
  agent?: string;
  privateKey?: string;
  passphrase?: string;
  readyTimeout?: number;
  strictVendor?: boolean;
  retries?: number;
  retry_factor?: number;
  retry_minTimeout?: number;
  promiseLimit?: number;
  remotePath?: string;
}

export interface WorkDirConfigurationSection {
  [key: string]: WorkDirConfiguration;
}

export interface WorkDirConfiguration {
  workDir: string;
}

export interface PoolConfigurationSection {
  passive: PoolConfiguration;
  heavy: PoolConfiguration;
}

export interface PoolConfiguration {
  max?: number;
  min?: number;
  minIdle?: number;
  idleTimeoutMillis?: number;
  maxQueue?: number;
}
