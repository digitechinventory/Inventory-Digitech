import nodemailer from 'nodemailer';

/**
 * Transaksional Email Service (Nodemailer)
 * PRD Section 6.3 & SDD Section 14
 */

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: { user, pass }
    });
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const from = process.env.SMTP_FROM || '"Digitech IMS" <digitechinventory@gmail.com>';
  const mailClient = getTransporter();

  if (!mailClient) {
    console.log(`\n📬 [MAILER - SIMULATED LOG (SMTP belum dikonfigurasi)]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body (Text): ${text || subject}`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);
    return { simulated: true, success: true };
  }

  try {
    const info = await mailClient.sendMail({
      from,
      to,
      subject,
      text,
      html
    });
    console.log(`[Mailer] Email terkirim ke ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Mailer] Gagal mengirim email ke ${to}:`, err.message);
    // Non-blocking fallback
    return { success: false, error: err.message };
  }
};

/**
 * Template Email: Konfirmasi Aktivasi Akun Pengguna
 */
export const sendActivationEmail = async (email, fullName, role, company) => {
  const subject = '🎉 Akun Portal Digitech IMS Anda Telah Diaktifkan';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="background-color: #0f172a; padding: 16px; border-radius: 8px; text-align: center; color: white;">
        <h2 style="margin: 0; color: #ef4444;">DIGITECH IMS</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Inventory Management System</p>
      </div>
      <div style="padding: 24px 0;">
        <h3 style="color: #1e293b;">Halo, ${fullName}!</h3>
        <p style="color: #475569; line-height: 1.6;">
          Akun Anda telah disetujui dan <strong>diaktifkan</strong> oleh Superadmin Digitech. Anda sekarang dapat masuk ke portal operasional.
        </p>
        <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0;">
          <p style="margin: 4px 0; font-size: 13px;"><strong>Mitra / Perusahaan:</strong> ${company || 'Digitech'}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Role Akses:</strong> <span style="color: #b91c1c; font-weight: bold;">${role?.toUpperCase()}</span></p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Status:</strong> Aktif (Siap Digunakan)</p>
        </div>
        <p style="color: #475569; line-height: 1.6;">
          Silakan akses portal Digitech IMS melalui peramban web Anda dan masuk menggunakan email dan password terdaftar.
        </p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
        © 2026 Digitech. Hak cipta dilindungi undang-undang.
      </div>
    </div>
  `;
  const text = `Halo ${fullName}, akun IMS Anda telah disetujui dan aktif dengan role ${role}. Silakan masuk ke portal.`;
  return sendEmail({ to: email, subject, html, text });
};

/**
 * Template Email: Alert Pendaftaran Baru ke Superadmin
 */
export const sendNewUserAlertToAdmin = async (adminEmail, newUser) => {
  const subject = `🔔 Pendaftaran Akun Baru Menunggu Aktivasi: ${newUser.full_name} (${newUser.company})`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0;">
      <h3 style="color: #0f172a; margin-top: 0;">Pengajuan Akun Pengguna Baru</h3>
      <p style="color: #475569;">Terdapat pengguna baru yang mendaftar ke portal IMS dan memerlukan verifikasi:</p>
      <ul style="color: #334155; line-height: 1.8;">
        <li><strong>Nama:</strong> ${newUser.full_name}</li>
        <li><strong>Email:</strong> ${newUser.email}</li>
        <li><strong>Perusahaan / Mitra:</strong> ${newUser.company}</li>
        <li><strong>Departemen:</strong> ${newUser.department}</li>
        <li><strong>No. Telp / WA:</strong> ${newUser.phone || '-'}</li>
      </ul>
      <p style="color: #475569;">Silakan buka menu <strong>Manajemen Akun &gt; Antrean Aktivasi</strong> untuk menyetujui atau menolak akun ini.</p>
    </div>
  `;
  return sendEmail({ to: adminEmail, subject, html, text: `Pendaftar baru: ${newUser.full_name} (${newUser.email}) menunggu aktivasi.` });
};

/**
 * Template Email: Update Status MOS (Completed / Rejected)
 */
export const sendMosNotificationEmail = async (email, docNumber, status, actionBy, notes = '') => {
  const isCompleted = status === 'completed';
  const subject = isCompleted 
    ? `✅ Dokumen MOS ${docNumber} Telah Disahkan (Completed)` 
    : `⚠️ Dokumen MOS ${docNumber} Memerlukan Revisi`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0;">
      <h3 style="color: ${isCompleted ? '#15803d' : '#b91c1c'}; margin-top: 0;">
        ${isCompleted ? 'Persetujuan Final Dokumen MOS Selesai' : 'Catatan Revisi Dokumen MOS'}
      </h3>
      <p style="color: #475569;">Nomor Dokumen: <strong>${docNumber}</strong></p>
      <p style="color: #475569;">Diproses Oleh: <strong>${actionBy}</strong></p>
      <p style="color: #475569;">Status Terbaru: <span style="font-weight: bold; color: ${isCompleted ? '#15803d' : '#b91c1c'};">${status.toUpperCase()}</span></p>
      ${notes ? `<div style="background: #fef2f2; border-left: 3px solid #ef4444; padding: 10px; margin: 12px 0;"><p style="margin: 0; color: #991b1b; font-size: 13px;"><strong>Catatan:</strong> ${notes}</p></div>` : ''}
      <p style="color: #64748b; font-size: 12px; margin-top: 20px;">Dokumen ini diproses secara elektronik sesuai hierarki otorisasi 3-slot IMS PT Borneo Indobara.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html, text: `Status MOS ${docNumber}: ${status}. Catatan: ${notes}` });
};
