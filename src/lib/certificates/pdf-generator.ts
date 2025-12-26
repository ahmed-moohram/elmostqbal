import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

interface CertificateData {
  studentName: string;
  courseName: string;
  instructorName: string;
  issueDate: string;
  certificateNumber: string;
  verificationUrl: string;
  durationHours?: number;
}

function drawCenteredText(
  page: any,
  text: string,
  y: number,
  size: number,
  font: any,
  color: ReturnType<typeof rgb>,
) {
  const { width } = page.getSize();
  const textWidth = font.widthOfTextAtSize(text, size);
  const x = (width - textWidth) / 2;
  page.drawText(text, { x, y, size, font, color });
}

/**
 * Generate a PDF certificate with QR code
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([800, 600]);

  // Load fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Background color
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    color: rgb(0.98, 0.98, 0.98),
  });

  // Border
  page.drawRectangle({
    x: 50,
    y: 50,
    width: 700,
    height: 500,
    borderColor: rgb(0.2, 0.4, 0.8),
    borderWidth: 3,
  });

  // Title
  drawCenteredText(page, 'شهادة إتمام', 500, 36, helveticaBold, rgb(0.2, 0.4, 0.8));

  // Certificate text
  const certificateText = `هذه الشهادة تثبت أن`;
  drawCenteredText(page, certificateText, 420, 16, helveticaFont, rgb(0.2, 0.2, 0.2));

  // Student name
  drawCenteredText(page, data.studentName, 380, 24, helveticaBold, rgb(0.1, 0.1, 0.1));

  // Course completion text
  const completionText = `قد أكمل بنجاح دورة`;
  drawCenteredText(page, completionText, 340, 16, helveticaFont, rgb(0.2, 0.2, 0.2));

  // Course name
  drawCenteredText(page, data.courseName, 300, 20, helveticaBold, rgb(0.2, 0.4, 0.8));

  // Instructor
  if (data.instructorName) {
    const instructorText = `المدرس: ${data.instructorName}`;
    drawCenteredText(page, instructorText, 250, 14, helveticaFont, rgb(0.4, 0.4, 0.4));
  }

  // Duration
  if (data.durationHours) {
    const durationText = `المدة: ${data.durationHours} ساعة`;
    drawCenteredText(page, durationText, 220, 12, helveticaFont, rgb(0.4, 0.4, 0.4));
  }

  // Issue date
  const dateText = `تاريخ الإصدار: ${new Date(data.issueDate).toLocaleDateString('ar-EG')}`;
  drawCenteredText(page, dateText, 190, 12, helveticaFont, rgb(0.4, 0.4, 0.4));

  // Certificate number
  const certNumberText = `رقم الشهادة: ${data.certificateNumber}`;
  drawCenteredText(page, certNumberText, 160, 10, helveticaFont, rgb(0.5, 0.5, 0.5));

  // Generate QR code
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data.verificationUrl, {
      width: 150,
      margin: 1,
    });

    // Convert data URL to image
    const qrCodeImage = await pdfDoc.embedPng(
      qrCodeDataUrl.split(',')[1] as string
    );

    // Draw QR code
    page.drawImage(qrCodeImage, {
      x: 325,
      y: 80,
      width: 150,
      height: 150,
    });

    // Verification text
    drawCenteredText(page, 'للتحقق من صحة الشهادة، امسح رمز QR', 60, 10, helveticaFont, rgb(0.5, 0.5, 0.5));
  } catch (error) {
    console.error('Error generating QR code:', error);
    // Continue without QR code if generation fails
  }

  // Footer
  drawCenteredText(page, '© EduFutura Platform - جميع الحقوق محفوظة', 30, 8, helveticaFont, rgb(0.6, 0.6, 0.6));

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

