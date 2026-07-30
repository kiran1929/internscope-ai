import fs from 'fs';
import path from 'path';

export class StorageService {
  private static STORAGE_DIR = path.join(process.cwd(), 'storage', 'resumes');

  private static ensureStorageDir() {
    if (!fs.existsSync(this.STORAGE_DIR)) {
      fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
    }
  }

  /**
   * Saves a file buffer securely to the local storage.
   * Returns the absolute path where the file is stored.
   */
  static async saveFile(userId: string, fileName: string, buffer: Buffer): Promise<string> {
    this.ensureStorageDir();
    
    // Generate a unique filename using userId and timestamp to prevent collisions
    const safeFileName = `${userId}_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const filePath = path.join(this.STORAGE_DIR, safeFileName);
    
    await fs.promises.writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Reads a file buffer by path.
   */
  static async readFile(filePath: string): Promise<Buffer> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    return fs.promises.readFile(filePath);
  }

  /**
   * Deletes a file by path.
   */
  static async deleteFile(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}
