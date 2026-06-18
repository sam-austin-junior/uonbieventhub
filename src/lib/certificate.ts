import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type CertificateInput = {
  attendeeName: string;
  eventName: string;
  eventTagline?: string | null;
  startDate: Date;
  endDate: Date;
  venue?: string | null;
  organizerName?: string | null;
  issuedAt?: Date;
  certificateId: string;
};

const BRAND = rgb(0.09, 0.28, 0.46);
const ACCENT = rgb(0.96, 0.7, 0.0);
const INK_900 = rgb(0.04, 0.08, 0.15);
const INK_500 = rgb(0.31, 0.38, 0.49);
const INK_300 = rgb(0.69, 0.74, 0.8);

export async function generateCertificate(input: CertificateInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificate — ${input.attendeeName} — ${input.eventName}`);
  pdf.setAuthor("University of Nairobi Event Hub");
  pdf.setCreator("UoN Event Hub");

  const page = pdf.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  // Outer decorative border
  page.drawRectangle({
    x: 24, y: 24, width: width - 48, height: height - 48,
    borderColor: BRAND, borderWidth: 2,
  });
  page.drawRectangle({
    x: 32, y: 32, width: width - 64, height: height - 64,
    borderColor: ACCENT, borderWidth: 1,
  });

  // Top accent bar
  page.drawRectangle({
    x: 32, y: height - 60, width: width - 64, height: 8,
    color: BRAND,
  });

  // Title
  const titleText = "CERTIFICATE OF ATTENDANCE";
  const titleSize = 22;
  const titleW = fontBold.widthOfTextAtSize(titleText, titleSize);
  page.drawText(titleText, {
    x: (width - titleW) / 2,
    y: height - 110,
    size: titleSize,
    font: fontBold,
    color: BRAND,
  });

  // Subtitle
  const sub = "This is to certify that";
  const subSize = 12;
  const subW = fontRegular.widthOfTextAtSize(sub, subSize);
  page.drawText(sub, {
    x: (width - subW) / 2,
    y: height - 160,
    size: subSize,
    font: fontRegular,
    color: INK_500,
  });

  // Attendee name
  const nameSize = 36;
  const nameW = fontBold.widthOfTextAtSize(input.attendeeName, nameSize);
  page.drawText(input.attendeeName, {
    x: (width - nameW) / 2,
    y: height - 220,
    size: nameSize,
    font: fontBold,
    color: INK_900,
  });
  page.drawLine({
    start: { x: (width - nameW) / 2 - 20, y: height - 230 },
    end: { x: (width + nameW) / 2 + 20, y: height - 230 },
    thickness: 0.5,
    color: INK_300,
  });

  // Attended copy
  const attended = "attended and successfully completed";
  const attendedSize = 12;
  const attendedW = fontRegular.widthOfTextAtSize(attended, attendedSize);
  page.drawText(attended, {
    x: (width - attendedW) / 2,
    y: height - 260,
    size: attendedSize,
    font: fontRegular,
    color: INK_500,
  });

  // Event name
  const eventSize = 20;
  const eventW = fontBold.widthOfTextAtSize(input.eventName, eventSize);
  page.drawText(input.eventName, {
    x: (width - eventW) / 2,
    y: height - 295,
    size: eventSize,
    font: fontBold,
    color: BRAND,
  });

  if (input.eventTagline) {
    const tagSize = 11;
    const tagW = fontItalic.widthOfTextAtSize(input.eventTagline, tagSize);
    page.drawText(input.eventTagline, {
      x: (width - tagW) / 2,
      y: height - 315,
      size: tagSize,
      font: fontItalic,
      color: INK_500,
    });
  }

  // Dates and venue line
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const datesLine = `${fmt(input.startDate)} – ${fmt(input.endDate)}${
    input.venue ? `  ·  ${input.venue}` : ""
  }`;
  const datesSize = 11;
  const datesW = fontRegular.widthOfTextAtSize(datesLine, datesSize);
  page.drawText(datesLine, {
    x: (width - datesW) / 2,
    y: height - 350,
    size: datesSize,
    font: fontRegular,
    color: INK_500,
  });

  // Footer: signatures + issued info
  const footerY = 90;
  const halfX = width / 2;

  if (input.organizerName) {
    page.drawLine({
      start: { x: halfX - 220, y: footerY + 30 },
      end: { x: halfX - 60, y: footerY + 30 },
      thickness: 0.5,
      color: INK_300,
    });
    page.drawText(input.organizerName, {
      x: halfX - 220,
      y: footerY + 14,
      size: 10,
      font: fontBold,
      color: INK_900,
    });
    page.drawText("Event Organizer", {
      x: halfX - 220,
      y: footerY,
      size: 9,
      font: fontRegular,
      color: INK_500,
    });
  }

  const issuedLabel = "Issued by";
  page.drawLine({
    start: { x: halfX + 60, y: footerY + 30 },
    end: { x: halfX + 220, y: footerY + 30 },
    thickness: 0.5,
    color: INK_300,
  });
  page.drawText("University of Nairobi Event Hub", {
    x: halfX + 60,
    y: footerY + 14,
    size: 10,
    font: fontBold,
    color: INK_900,
  });
  page.drawText(issuedLabel, {
    x: halfX + 60,
    y: footerY,
    size: 9,
    font: fontRegular,
    color: INK_500,
  });

  // Bottom-right meta
  const issued = (input.issuedAt ?? new Date()).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const certMeta = `Certificate ID: ${input.certificateId}   ·   Issued ${issued}`;
  page.drawText(certMeta, {
    x: 50,
    y: 50,
    size: 8,
    font: fontRegular,
    color: INK_300,
  });

  return pdf.save();
}
