import fs from 'fs';
import path from 'path';
import os from 'os';

export class StorageService {
  // On Vercel Serverless, the root directory /var/task is read-only.
  // We use os.tmpdir() on serverless or storage/resumes on local dev.
  private static getStorageDir(): string {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      return path.join(os.tmpdir(), 'resumes');
    }
    return path.join(process.cwd(), 'storage', 'resumes');
  }

  private static ensureStorageDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Saves a file buffer securely.
   * On serverless / local environments, writes to disk or returns data-URI prefix if desired.
   * Returns the absolute path where the file is stored.
   */
  static async saveFile(userId: string, fileName: string, buffer: Buffer): Promise<string> {
    const storageDir = this.getStorageDir();
    this.ensureStorageDir(storageDir);
    
    // Generate a unique filename using userId and timestamp to prevent collisions
    const safeFileName = `${userId}_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const filePath = path.join(storageDir, safeFileName);
    
    await fs.promises.writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Reads a file buffer by path.
   */
  static async readFile(filePath: string): Promise<Buffer> {
    if (filePath.startsWith('data:')) {
      const base64Data = filePath.split(',')[1];
      return Buffer.from(base64Data, 'base64');
    }
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    return fs.promises.readFile(filePath);
  }

  /**
   * Deletes a file by path.
   */
  static async deleteFile(filePath: string): Promise<void> {
    if (filePath.startsWith('data:')) return;
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}
