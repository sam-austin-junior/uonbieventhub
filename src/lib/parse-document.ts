export type ParsedDocument = {
  text: string;
  fileType: "pdf" | "docx" | "txt" | "md" | "doc";
  charCount: number;
};

export async function parseDocument(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ParsedDocument> {
  const lowerName = fileName.toLowerCase();
  let fileType: ParsedDocument["fileType"];
  let text = "";

  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    fileType = "pdf";
    const pdf = (await import("pdf-parse/lib/pdf-parse.js")).default as (
      data: Buffer
    ) => Promise<{ text: string }>;
    const result = await pdf(buffer);
    text = result.text;
  } else if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    fileType = "docx";
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (mimeType === "application/msword" || lowerName.endsWith(".doc")) {
    fileType = "doc";
    text = buffer.toString("utf-8");
  } else if (
    mimeType === "text/plain" ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    mimeType === "text/markdown"
  ) {
    fileType = lowerName.endsWith(".md") ? "md" : "txt";
    text = buffer.toString("utf-8");
  } else {
    throw new Error(`Unsupported file type: ${mimeType || fileName}`);
  }

  text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return { text, fileType, charCount: text.length };
}
