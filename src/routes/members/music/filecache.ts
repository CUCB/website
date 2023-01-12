import { LS_COLORS } from "$env/static/private";
import { stat, utimes, readdir, rm } from "fs/promises";
import { DateTime } from "luxon";

export interface FileSystem {
  //   exists(path: string): Promise<boolean>;
  ls(root: string): Promise<string[]>;
  lastUpdated(path: string): Promise<Date | null>;
  touchIfExists(path: string): Promise<Date | null>;
  remove(path: string): Promise<void>;
}

export class LinuxFileSystem {
  constructor() {}

  ls(root: string): Promise<string[]> {
    return readdir(root);
  }

  lastUpdated(path: string): Promise<Date | null> {
    return stat(path)
      .then((statResult) => statResult.mtime)
      .catch(() => null);
  }

  touchIfExists(path: string): Promise<Date | null> {
    const time = new Date();
    return utimes(path, time, time)
      .then(() => time)
      .catch(() => null);
  }

  remove(path: string): Promise<void> {
    return rm(path).catch(() => undefined);
  }
}

export class FileSystemCache {
  fs: FileSystem;

  constructor(fs?: FileSystem) {
    this.fs = fs ?? new LinuxFileSystem();
  }

  async deleteOldFiles(root: string) {
    const files = await this.fs.ls(root);
    const updatedPaths = await Promise.all(
      files.map((path) => this.fs.lastUpdated(path).then((mtime) => [path, mtime] as const)),
    );
    const currentTime = DateTime.local();
    const pathsToDelete = updatedPaths
      .filter(([_path, mtime]) => mtime && currentTime.diff(DateTime.fromJSDate(mtime)).as("days") > 2)
      .map(([path, _mtime]) => path);
    await Promise.all(pathsToDelete.map((path) => this.fs.remove(path)));
  }
}
