import { workspace } from "vscode";

class Configuration {

  async getRemotesConfiguration() {
    const currentRemotes = workspace.getConfiguration('sftpfs').get<RemoteConfigurationSection>('remotes');
    if (currentRemotes === undefined) {
      return {};
    }

    return currentRemotes;
  };

  async getRemotesConfigurationNames() {
    return Object.keys(await this.getRemotesConfiguration());
  }

  async saveRemoteConfiguration(
    name: string,
    host: string,
    port: number,
    username: string,
    remotePath: string,
    password?: string
  ) {
    const config = await this.getRemotesConfiguration();
    config[name.trim().toLowerCase()] = {
      host,
      port,
      username,
      password,
      remotePath
    };
    await workspace.getConfiguration('sftpfs').update('remotes', config, true);
  }

  async removeRemoteConfiguration(namesToRemove: string[]) {
    const config = await this.getRemotesConfiguration();
    const newStorage = Object.keys(config)
    .filter(sKey => namesToRemove.find((n) => n === sKey) === undefined)
    .reduce((obj: RemoteConfigurationSection, key: string)=> {
      obj[key] = config[key];
      return obj;
    }, {} as RemoteConfigurationSection);
    await workspace.getConfiguration('sftpfs').update('remotes', newStorage, true);
  }

  async getRemoteConfiguration(name: string) {
    const config = await this.getRemotesConfiguration();
    if (!(name in config)) {
      return undefined;
    }
    return config[name];
  }

  async getWorkDirForRemote(remoteName: string) {
    const workDirsConfig = workspace.getConfiguration('sftpfs').get<WorkDirConfigurationSection>('workDirs');
    if (workDirsConfig === undefined) {
      return undefined;
    }
    if (!(remoteName in workDirsConfig)) {
      return undefined;
    }
    return workDirsConfig[remoteName].workDir;
  }

  async setWorkDirForRemote(remoteName: string, workDir: string) {
    const workDirsConfig = workspace.getConfiguration('sftpfs').get<WorkDirConfigurationSection>('workDirs') ?? {};
    const newStorage = Object.keys(workDirsConfig)
    .filter(sKey => remoteName !== sKey)
    .reduce((obj: WorkDirConfigurationSection, key: string)=> {
      obj[key] = workDirsConfig[key];
      return obj;
    }, {} as WorkDirConfigurationSection);
    newStorage[remoteName] = {
      workDir
    };
    await workspace.getConfiguration('sftpfs').update('workDirs', newStorage, false);
  }
}

const configuration = new Configuration();
export default configuration;

export interface RemoteConfigurationSection {
  [key: string]: RemoteConfiguration
}

export interface RemoteConfiguration {
  host?: string
  port?: number
  forceIPv4?: boolean
  forceIPv6?: boolean
  username?: string
  password?: string
  agent?: string
  privateKey?: string
  passphrase?: string
  readyTimeout?: number
  strictVendor?: boolean
  retries?: number
  retry_factor?: number
  retry_minTimeout?: number
  promiseLimit?: number
  remotePath?: string
}

export interface WorkDirConfigurationSection {
  [key: string]: WorkDirConfiguration
}

export interface WorkDirConfiguration {
  workDir: string
}

export interface PoolConfigurationSection {
  passive: PoolConfiguration
  heavy: PoolConfiguration
}

export interface PoolConfiguration {
  max?: number
  min?: number
  minIdle?: number
  idleTimeoutMillis?: number
  maxQueue?: number
}
