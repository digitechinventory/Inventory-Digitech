import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded regardless of execution working directory
if (!process.env.SMTP_HOST) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
  dotenv.config();
}

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
        &copy; 2026 Digitech. Hak cipta dilindungi undang-undang.
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h3 style="color: #0f172a; margin-top: 0;">Pengajuan Akun Pengguna Baru</h3>
      <p style="color: #475569;">Terdapat pengguna baru yang mendaftar ke portal IMS dan memerlukan verifikasi:</p>
      <ul style="color: #334155; line-height: 1.8;">
        <li><strong>Nama:</strong> ${newUser.full_name}</li>
        <li><strong>Email:</strong> ${newUser.email}</li>
        <li><strong>Perusahaan / Mitra:</strong> ${newUser.company}</li>
        <li><strong>Departemen:</strong> ${newUser.department}</li>
        <li><strong>No. Telp / WA:</strong> ${newUser.phone || '-'}</li>
      </ul>
      <p style="color: #475569;">Silakan buka menu <strong>Manajemen Pengguna &gt; Antrean Aktivasi</strong> untuk menyetujui atau menolak akun ini.</p>
    </div>
  `;
  return sendEmail({ to: adminEmail, subject, html, text: `Pendaftar baru: ${newUser.full_name} (${newUser.email}) menunggu aktivasi.` });
};

/**
 * Template Email: Update Status MOS & Dokumen Approval (Completed / Rejected / Step Signed)
 */
export const sendMosNotificationEmail = async (email, docNumber, status, actionBy, notes = '') => {
  const isCompleted = status === 'completed';
  const subject = isCompleted 
    ? `✅ Dokumen MOS ${docNumber} Telah Disahkan (Completed)` 
    : `⚠️ Dokumen MOS ${docNumber}: Status ${status.toUpperCase()}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h3 style="color: ${isCompleted ? '#15803d' : '#b91c1c'}; margin-top: 0;">
        ${isCompleted ? 'Persetujuan Final Dokumen MOS Selesai' : 'Pemberitahuan Status Dokumen MOS'}
      </h3>
      <p style="color: #475569;">Nomor Dokumen: <strong>${docNumber}</strong></p>
      <p style="color: #475569;">Diproses Oleh: <strong>${actionBy}</strong></p>
      <p style="color: #475569;">Status Terbaru: <span style="font-weight: bold; color: ${isCompleted ? '#15803d' : '#b91c1c'};">${status.toUpperCase()}</span></p>
      ${notes ? `<div style="background: #fef2f2; border-left: 3px solid #ef4444; padding: 10px; margin: 12px 0;"><p style="margin: 0; color: #991b1b; font-size: 13px;"><strong>Catatan:</strong> ${notes}</p></div>` : ''}
      <p style="color: #64748b; font-size: 12px; margin-top: 20px;">Dokumen ini diproses secara elektronik sesuai hierarki otorisasi 3-slot IMS DIGITECH.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html, text: `Status MOS ${docNumber}: ${status}. Catatan: ${notes}` });
};

/**
 * Template Email: Pemberitahuan Perubahan Pengaturan Akun & Keamanan
 */
export const sendAccountSettingsChangeEmail = async (email, fullName, changeType, details = '') => {
  const subject = `🔒 [Keamanan Akun] Perubahan Pengaturan Akun Digitech IMS: ${changeType}`;
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="background-color: #0f172a; padding: 16px; border-radius: 8px; text-align: center; color: white;">
        <h2 style="margin: 0; color: #ef4444;">DIGITECH SECURITY ALERT</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Notifikasi Perubahan Pengaturan Akun</p>
      </div>
      <div style="padding: 20px 0;">
        <h3 style="color: #1e293b;">Halo, ${fullName}!</h3>
        <p style="color: #475569; line-height: 1.6;">
          Kami mengonfirmasi bahwa terdapat perubahan pada pengaturan akun Anda di portal operasional <strong>Digitech IMS</strong>:
        </p>
        <div style="background: #f8fafc; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0;">
          <p style="margin: 4px 0; font-size: 13px;"><strong>Aktivitas:</strong> <span style="color: #b91c1c; font-weight: bold;">${changeType}</span></p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Waktu (WITA):</strong> ${timestamp} WITA</p>
          ${details ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Detail:</strong> ${details}</p>` : ''}
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.6;">
          Bila Anda tidak merasa melakukan perubahan ini, segera hubungi Superadmin IMS Digitech atau lakukan reset kata sandi akun Anda segera.
        </p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
        &copy; 2026 Digitech Security Ops. Pesan otomatis dikirim oleh sistem.
      </div>
    </div>
  `;
  const text = `Halo ${fullName}, terdapat perubahan pengaturan akun Anda (${changeType}) pada ${timestamp} WITA.`;
  return sendEmail({ to: email, subject, html, text });
};

/**
 * Template Email: Pemberitahuan Agenda & Jadwal Site Baru / Diperbarui
 */
export const sendAgendaNotificationEmail = async (email, { title, date, time, site, pic, category, description, actionType = 'dijadwalkan' }) => {
  const subject = `📅 [Agenda Site] ${title} (${date})`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="background-color: #0f172a; padding: 16px; border-radius: 8px; text-align: center; color: white;">
        <h2 style="margin: 0; color: #ef4444;">AGENDA OPERASIONAL SITE</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Digitech Mining Operations Calendar</p>
      </div>
      <div style="padding: 20px 0;">
        <p style="color: #475569; line-height: 1.6;">
          Agenda operasional berikut telah <strong>${actionType}</strong> di kalender site:
        </p>
        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 14px 16px; margin: 16px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; color: #1e293b;">${title}</h3>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Tanggal:</strong> ${date}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Waktu:</strong> ${time || '08:00 - Selesai'}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Lokasi / Site:</strong> ${site || 'Area Tambang Sebamban'}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Kategori:</strong> <span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: bold;">${category || 'Operasional'}</span></p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>PIC Penanggung Jawab:</strong> ${pic || 'Tim Operasional'}</p>
          ${description ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 6px;"><em>${description}</em></p>` : ''}
        </div>
        <p style="color: #64748b; font-size: 12px;">
          Silakan buka menu <strong>Agenda &amp; Kalender Site</strong> pada portal untuk detail dan konfirmasi kehadiran.
        </p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
        &copy; 2026 Digitech Mining Operations.
      </div>
    </div>
  `;
  const text = `Agenda Site: ${title} pada tanggal ${date} (${time}) di ${site}. PIC: ${pic}.`;
  return sendEmail({ to: email, subject, html, text });
};

/**
 * Template Email: Kode OTP Verifikasi Dua Langkah (2FA Login)
 */
export const sendTwoFactorOtpEmail = async (email, fullName, otpCode) => {
  const subject = `🔐 [Verifikasi 2FA] Kode Keamanan Login Digitech IMS: ${otpCode}`;
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
      <div style="background-color: #0f172a; padding: 20px; border-radius: 12px; text-align: center; color: white;">
        <h2 style="margin: 0; color: #ef4444; font-size: 20px; letter-spacing: 1px;">DIGITECH SECURITY AUTH</h2>
        <p style="margin: 6px 0 0 0; font-size: 12px; color: #94a3b8;">Verifikasi Dua Langkah (Two-Factor Authentication)</p>
      </div>
      <div style="padding: 24px 0; text-align: center;">
        <h3 style="color: #1e293b; margin-top: 0;">Halo, ${fullName || 'Pengguna'}!</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; max-width: 460px; margin: 0 auto;">
          Gunakan 6-digit kode verifikasi di bawah ini untuk menyelesaikan otorisasi masuk ke portal <strong>Digitech IMS</strong>:
        </p>

        <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; margin: 24px auto; max-width: 320px;">
          <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #dc2626; font-family: monospace;">
            ${otpCode}
          </div>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600;">
            Berlaku selama 5 menit • Sekali Pakai (One-Time Passcode)
          </p>
        </div>

        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 20px 0; text-align: left; border-radius: 4px;">
          <p style="margin: 0; color: #991b1b; font-size: 12px; line-height: 1.5;">
            <strong>Penting:</strong> Jangan berikan kode ini kepada siapa pun termasuk staf operasional Digitech. Jika Anda tidak mencoba masuk pada ${timestamp} WITA, segera amankan akun Anda.
          </p>
        </div>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
        &copy; 2026 Digitech Systems &amp; Security Operations. Email otomatis aman.
      </div>
    </div>
  `;
  const text = `Kode verifikasi 2FA Anda adalah: ${otpCode}. Berlaku 5 menit. Jangan bagikan kepada siapa pun.`;
  return sendEmail({ to: email, subject, html, text });
};

