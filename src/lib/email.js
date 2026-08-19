import nodemailer from "nodemailer";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromName = process.env.SMTP_FROM_NAME || "Tamuin";

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export function getSenderEmail() {
  return process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "noreply@example.com";
}

function buildQRUrl(token) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${baseUrl}/scan/${token}`;
}

export function buildEmailHtml({ nama, acara, tanggal, lokasi, qrToken, jamMulai, jamSelesai }) {
  const scanUrl = buildQRUrl(qrToken);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; margin: 0 0 4px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 0; }
    .body { padding: 32px; }
    .greeting { font-size: 16px; color: #1a1a2e; margin-bottom: 20px; }
    .greeting strong { color: #4f46e5; }
    .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .detail-table td { padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .detail-table td:first-child { color: #6b7280; width: 100px; }
    .detail-table td:last-child { color: #1a1a2e; font-weight: 500; }
    .qr-section { text-align: center; padding: 24px; background: #f8f9fc; border-radius: 12px; margin: 24px 0; }
    .qr-section p { color: #6b7280; font-size: 13px; margin: 8px 0 0; }
    .btn { display: inline-block; padding: 12px 24px; background: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 16px; }
    .footer { text-align: center; padding: 24px; color: #9ca3af; font-size: 12px; }
    .footer a { color: #4f46e5; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>QR Code Kehadiran</h1>
        <p>Gunakan QR Code ini untuk check-in</p>
      </div>
      <div class="body">
        <div class="greeting">
          Halo, <strong>${nama}</strong>!
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
          Terima kasih telah mendaftar untuk acara berikut. Silakan gunakan QR Code di bawah untuk check-in saat acara berlangsung.
        </p>

        <table class="detail-table">
          <tr><td>Acara</td><td>${acara}</td></tr>
          <tr><td>Tanggal</td><td>${tanggal}</td></tr>
          <tr><td>Waktu</td><td>${jamMulai} - ${jamSelesai}</td></tr>
          <tr><td>Lokasi</td><td>${lokasi}</td></tr>
        </table>

        <div class="qr-section">
          <p style="font-size: 14px; color: #1a1a2e; font-weight: 600; margin-bottom: 12px;">QR Code Kehadiran</p>
          <a href="${scanUrl}">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(scanUrl)}" alt="QR Code" width="180" height="180" style="border-radius: 8px;" />
          </a>
          <p style="margin-top: 12px;">Atau klik tombol di bawah untuk membuka halaman check-in</p>
          <a href="${scanUrl}" class="btn">Buka Halaman Check-in</a>
        </div>

        <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 24px;">
          Simpan QR Code ini dan tunjukkan saat check-in di lokasi acara.
        </p>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Tamuin. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendMail({ to, subject, html }) {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn("[email] SMTP not configured, skipping send");
    return { success: false, error: "SMTP not configured" };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || "Tamuin"}" <${getSenderEmail()}>`,
      to,
      subject,
      html,
    });
    console.log("[email] Sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[email] Send error:", error);
    return { success: false, error: error.message };
  }
}
