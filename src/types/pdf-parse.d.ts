// pdf-parse's main entry triggers a test-file read on import, so we use the
// deep entry point that just exports the function. @types/pdf-parse only ships
// types for the main entry, so we declare the deep one here.
declare module "pdf-parse/lib/pdf-parse.js" {
  function pdf(data: Buffer | Uint8Array): Promise<{
    text: string;
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
  }>;
  export default pdf;
}
