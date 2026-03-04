declare module 'xlsx' {
  export function read(data: string | ArrayBuffer, opts?: { type?: string }): WorkBook;
  export function writeFile(wb: WorkBook, filename: string, opts?: unknown): void;
  export const utils: {
    sheet_to_json<T>(sheet: WorkSheet, opts?: { header?: number | string[]; defval?: string }): T[];
    aoa_to_sheet(data: unknown[][]): WorkSheet;
    book_new(): WorkBook;
    book_append_sheet(wb: WorkBook, ws: WorkSheet, name: string): void;
  };
  export interface WorkBook {
    SheetNames: string[];
    Sheets: Record<string, WorkSheet>;
  }
  export interface WorkSheet {
    [key: string]: unknown;
  }
}
