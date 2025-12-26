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
  page.drawText('شهادة إتمام', {
    x: 400,
    y: 500,
    size: 36,
    font: helveticaBold,
    color: rgb(0.2, 0.4, 0.8),
    textAlign: 'center',
  });

  // Certificate text
  const certificateText = `هذه الشهادة تثبت أن`;
  page.drawText(certificateText, {
    x: 400,
    y: 420,
    size: 16,
    font: helveticaFont,
    color: rgb(0.2, 0.2, 0.2),
    textAlign: 'center',
  });

  // Student name
  page.drawText(data.studentName, {
    x: 400,
    y: 380,
    size: 24,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
    textAlign: 'center',
  });

  // Course completion text
  const completionText = `قد أكمل بنجاح دورة`;
  page.drawText(completionText, {
    x: 400,
    y: 340,
    size: 16,
    font: helveticaFont,
    color: rgb(0.2, 0.2, 0.2),
    textAlign: 'center',
  });

  // Course name
  page.drawText(data.courseName, {
    x: 400,
    y: 300,
    size: 20,
    font: helveticaBold,
    color: rgb(0.2, 0.4, 0.8),
    textAlign: 'center',
  });

  // Instructor
  if (data.instructorName) {
    const instructorText = `المدرس: ${data.instructorName}`;
    page.drawText(instructorText, {
      x: 400,
      y: 250,
      size: 14,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
      textAlign: 'center',
    });
  }

  // Duration
  if (data.durationHours) {
    const durationText = `المدة: ${data.durationHours} ساعة`;
    page.drawText(durationText, {
      x: 400,
      y: 220,
      size: 12,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
      textAlign: 'center',
    });
  }

  // Issue date
  const dateText = `تاريخ الإصدار: ${new Date(data.issueDate).toLocaleDateString('ar-EG')}`;
  page.drawText(dateText, {
    x: 400,
    y: 190,
    size: 12,
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4),
    textAlign: 'center',
  });

  // Certificate number
  const certNumberText = `رقم الشهادة: ${data.certificateNumber}`;
  page.drawText(certNumberText, {
    x: 400,
    y: 160,
    size: 10,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
    textAlign: 'center',
  });

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
    page.drawText('للتحقق من صحة الشهادة، امسح رمز QR', {
      x: 400,
      y: 60,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
      textAlign: 'center',
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    // Continue without QR code if generation fails
  }

  // Footer
  page.drawText('© EduFutura Platform - جميع الحقوق محفوظة', {
    x: 400,
    y: 30,
    size: 8,
    font: helveticaFont,
    color: rgb(0.6, 0.6, 0.6),
    textAlign: 'center',
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

