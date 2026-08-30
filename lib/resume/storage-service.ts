import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

export class StorageService {
  private static getStorageDir(): string {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      return path.join(os.tmpdir(), 'resumes');
    }
    return path.join(process.cwd(), 'storage', 'resumes');
  }

  private static getStagingDir(): string {
    return path.join(this.getStorageDir(), 'staging');
  }

  private static ensureStorageDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 });
    }
  }

  private static resolveSafePath(baseDir: string, fileName: string): string {
    const resolvedBase = path.resolve(baseDir);
    const resolvedPath = path.resolve(baseDir, fileName);
    if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
      throw new Error('Invalid storage path');
    }
    return resolvedPath;
  }

  /**
   * Writes validated content to a staging location before DB finalization.
   */
  static async saveToStaging(userId: string, extension: string, buffer: Buffer): Promise<string> {
    const stagingDir = this.getStagingDir();
    this.ensureStorageDir(stagingDir);

    const storageName = `${userId}_${randomUUID()}${extension}`;
    const filePath = this.resolveSafePath(stagingDir, storageName);

    await fs.promises.writeFile(filePath, buffer, { mode: 0o600 });
    return filePath;
  }

  /**
   * Promotes a staged file into final storage with a new random identifier.
   */
  static async promoteFromStaging(stagedPath: string, extension: string): Promise<string> {
    const storageDir = this.getStorageDir();
    this.ensureStorageDir(storageDir);

    if (!fs.existsSync(stagedPath)) {
      throw new Error('Staged file not found');
    }

    const finalName = `${randomUUID()}${extension}`;
    const finalPath = this.resolveSafePath(storageDir, finalName);

    await fs.promises.rename(stagedPath, finalPath);
    return finalPath;
  }

  /**
   * Legacy direct save — generates server-side name only (no user-controlled path segments).
   */
  static async saveFile(userId: string, extension: string, buffer: Buffer): Promise<string> {
    const storageDir = this.getStorageDir();
    this.ensureStorageDir(storageDir);

    const storageName = `${userId}_${randomUUID()}${extension}`;
    const filePath = this.resolveSafePath(storageDir, storageName);

    await fs.promises.writeFile(filePath, buffer, { mode: 0o600 });
    return filePath;
  }

  static async readFile(filePath: string): Promise<Buffer> {
    if (filePath.startsWith('data:')) {
      const base64Data = filePath.split(',')[1];
      return Buffer.from(base64Data, 'base64');
    }

    const storageDir = this.getStorageDir();
    const stagingDir = this.getStagingDir();
    const resolved = path.resolve(filePath);
    const allowedRoots = [path.resolve(storageDir), path.resolve(stagingDir)];

    if (!allowedRoots.some((root) => resolved.startsWith(root + path.sep))) {
      throw new Error('Access to file path is not permitted');
    }

    if (!fs.existsSync(resolved)) {
      throw new Error('File not found');
    }

    return fs.promises.readFile(resolved);
  }

  static async deleteFile(filePath: string): Promise<void> {
    if (filePath.startsWith('data:')) return;

    try {
      const storageDir = this.getStorageDir();
      const stagingDir = this.getStagingDir();
      const resolved = path.resolve(filePath);
      const allowedRoots = [path.resolve(storageDir), path.resolve(stagingDir)];

      if (!allowedRoots.some((root) => resolved.startsWith(root + path.sep))) {
        return;
      }

      if (fs.existsSync(resolved)) {
        await fs.promises.unlink(resolved);
      }
    } catch {
      // Best-effort cleanup
    }
  }

  /**
   * Removes stale staged files older than maxAgeMs (default 24h).
   */
  static async cleanupStaleStaging(maxAgeMs = 24 * 60 * 60 * 1000): Promise<number> {
    const stagingDir = this.getStagingDir();
    if (!fs.existsSync(stagingDir)) return 0;

    const now = Date.now();
    let removed = 0;
    const entries = await fs.promises.readdir(stagingDir);

    for (const entry of entries) {
      const fullPath = path.join(stagingDir, entry);
      try {
        const stat = await fs.promises.stat(fullPath);
        if (now - stat.mtimeMs > maxAgeMs) {
          await fs.promises.unlink(fullPath);
          removed++;
        }
      } catch {
        // ignore individual cleanup failures
      }
    }

    return removed;
  }
}
