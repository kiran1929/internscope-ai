import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

export interface ExtractionResult {
  text: string;
  isScanned: boolean;
  format: 'PDF' | 'DOCX' | 'TXT';
}

export class ExtractionService {
  /**
   * Main entrypoint to extract clean text from resume buffers.
   */
  static async extractText(buffer: Buffer, mimeType: string): Promise<ExtractionResult> {
    const type = mimeType.toLowerCase();
    
    try {
      if (type === 'application/pdf' || type.includes('pdf')) {
        return await this.extractPdf(buffer);
      } else if (
        type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        type.includes('docx') || 
        type.includes('msword')
      ) {
        return await this.extractDocx(buffer);
      } else if (type === 'text/plain' || type.includes('txt')) {
        const text = buffer.toString('utf-8');
        return {
          text: this.normalizeText(text),
          isScanned: false,
          format: 'TXT',
        };
      } else {
        throw new Error(`Unsupported document mime-type: ${mimeType}`);
      }
    } catch (error) {
      console.error(`Document extraction error for ${mimeType}:`, error);
      throw new Error(`Failed to extract text. The document may be corrupted or in an invalid format.`);
    }
  }

  private static async extractPdf(buffer: Buffer): Promise<ExtractionResult> {
    // pdf-parse throws if PDF binary structure is corrupted
    let data;
    try {
      if (typeof (globalThis as any).pdfjsWorker === 'undefined') {
        (globalThis as any).pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.mjs');
      }
      const parser = new PDFParse({ data: buffer });
      data = await parser.getText();
    } catch (e) {
      throw new Error('Corrupted PDF binary payload');
    }

    const rawText = data.text || '';
    const normalized = this.normalizeText(rawText);

    // Scanned PDF detection:
    // If the file is relatively large (> 40 KB) but we extracted less than 150 characters,
    // the document is likely scanned / image-only.
    const isScanned = buffer.length > 40000 && normalized.trim().length < 150;

    return {
      text: normalized,
      isScanned,
      format: 'PDF',
    };
  }

  private static async extractDocx(buffer: Buffer): Promise<ExtractionResult> {
    let result;
    try {
      result = await mammoth.extractRawText({ buffer });
    } catch (e) {
      throw new Error('Corrupted DOCX binary payload');
    }

    const normalized = this.normalizeText(result.value || '');
    return {
      text: normalized,
      isScanned: false,
      format: 'DOCX',
    };
  }

  /**
   * Cleans raw extracted text:
   * - Normalizes UTF-8 strings.
   * - Removes non-printable formatting control characters.
   * - Condenses excessive whitespace, double carriage returns, and line endings.
   */
  private static normalizeText(text: string): string {
    if (!text) return '';

    return text
      // Normalize Unicode character normalization
      .normalize('NFC')
      // Remove null bytes and non-printable control characters (excluding tab/new-line)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      // Replace duplicate tabs or whitespace lines
      .replace(/[ \t]+/g, ' ')
      // Normalize line ends
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Condense more than two consecutive newlines into exactly two
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
