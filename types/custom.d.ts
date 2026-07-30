declare module 'pdf-parse' {
  export class PDFParse {
    constructor(options: { data: Buffer; verbosity?: number });
    getText(options?: any): Promise<{ text: string; pages: Array<{ text: string; num: number }> }>;
  }
}

declare module 'mammoth' {
  export interface ExtractionResult {
    value: string;
    messages: any[];
  }
  export function extractRawText(options: { buffer: Buffer }): Promise<ExtractionResult>;
}
