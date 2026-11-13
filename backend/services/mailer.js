import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
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
 * Digitech Inventory Management System
 */

const LOGO_PATH = path.join(__dirname, '../assets/digitech-emblem.png');

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

/**
 * Header Email Resmi PT Digitech
 * Kop surat elektronik dengan emblem resmi Digitech + Inventory Management System.
 */
const getEmailHeader = (subtitle = 'Pemberitahuan Sistem') => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 2px solid #b91c1c; padding-bottom: 16px; margin-bottom: 24px;">
    <tr>
      <td align="left" valign="middle">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td valign="middle" style="padding-right: 12px;">
              <img src="cid:digitechLogo" alt="Digitech" width="42" height="42" style="display: block; width: 42px; height: 42px; border-radius: 8px; border: 1px solid #e2e8f0; background-color: #ffffff;" />
            </td>
            <td valign="middle">
              <div style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: 0.06em; line-height: 1.1; font-family: Arial, sans-serif;">
                DIGITECH
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #dc2626; margin-top: 3px; font-family: Arial, sans-serif;">
                Inventory Management System
              </div>
            </td>
          </tr>
        </table>
      </td>
      <td align="right" valign="middle" style="font-size: 11px; font-weight: 600; color: #64748b; font-family: Arial, sans-serif;">
        ${subtitle}
      </td>
    </tr>
  </table>
`;

/**
 * Footer Email Resmi PT Digitech
 */
const getEmailFooter = (extra = 'Dokumen & pemberitahuan elektronik resmi operasional gudang dan site.') => `
  <div style="border-top: 1px solid #e2e8f0; margin-top: 28px; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center; font-family: Arial, sans-serif; line-height: 1.6;">
    <strong style="color: #0f172a;">PT Digitech &bull; Inventory Management System</strong><br/>
    <span>${extra}</span><br/>
    <span style="color: #94a3b8; font-size: 10px;">&copy; ${new Date().getFullYear()} PT Digitech. Hak cipta dilindungi.</span>
  </div>
`;

const wrapEmailShell = (innerHtml) => `
  <div style="background-color: #f8fafc; padding: 24px 12px; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 28px 28px 22px 28px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff; color: #1e293b;">
      ${innerHtml}
    </div>
  </div>
`;

const buildKvTable = (rows) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #e2e8f0; border-radius: 6px;">
    ${rows.map(([label, value], idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
        <td style="padding: 9px 12px; font-size: 12px; font-weight: 700; color: #475569; width: 38%; border-bottom: ${idx < rows.length - 1 ? '1px solid #e2e8f0' : 'none'}; font-family: Arial, sans-serif;">
          ${label}
        </td>
        <td style="padding: 9px 12px; font-size: 13px; color: #0f172a; border-bottom: ${idx < rows.length - 1 ? '1px solid #e2e8f0' : 'none'}; font-family: Arial, sans-serif;">
          ${value}
        </td>
      </tr>
    `).join('')}
  </table>
`;

export const sendEmail = async ({ to, subject, html, text, attachments }) => {
  const from = process.env.SMTP_FROM || '"Digitech Inventory Management System" <digitechinventory@gmail.com>';
  const mailClient = getTransporter();

  const baseAttachments = fs.existsSync(LOGO_PATH) ? [{
    filename: 'digitech-emblem.png',
    path: LOGO_PATH,
    cid: 'digitechLogo'
  }] : [];

  const finalAttachments = Array.isArray(attachments) && attachments.length > 0
    ? [...baseAttachments, ...attachments.filter(a => a.cid !== 'digitechLogo')]
    : baseAttachments;

  if (!mailClient) {
    console.log(`\n[MAILER - SIMULATED LOG (SMTP belum dikonfigurasi)]`);
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
      html,
      attachments: finalAttachments
    });
    console.log(`[Mailer] Email terkirim ke ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Mailer] Gagal mengirim email ke ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Template Email: Konfirmasi Aktivasi Akun Pengguna
 */
export const sendActivationEmail = async (email, fullName, role, company) => {
  const subject = '[Digitech IMS] Aktivasi Akun Portal Operasional';
  const html = wrapEmailShell(`
    ${getEmailHeader('Aktivasi Akun Pengguna')}
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #0f172a; font-weight: 700;">
      Yth. ${fullName},
    </p>
    <p style="margin: 0 0 14px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      Pengajuan akun Anda pada sistem <strong>Digitech Inventory Management System</strong> telah disetujui oleh administrator dan saat ini berstatus aktif.
    </p>
    ${buildKvTable([
      ['Perusahaan / Mitra', company || 'PT Digitech'],
      ['Peran Akses', `<strong style="color: #b91c1c;">${role || 'User'}</strong>`],
      ['Status Akun', '<strong style="color: #15803d;">Aktif</strong>']
    ])}
    <p style="margin: 14px 0 0 0; font-size: 13px; color: #475569; line-height: 1.6;">
      Silakan masuk ke portal menggunakan alamat email dan kata sandi yang telah Anda daftarkan.
    </p>
    ${getEmailFooter()}
  `);
  const text = `Yth. ${fullName}, akun Digitech IMS Anda telah aktif dengan peran ${role}. Silakan masuk ke portal.`;
  return sendEmail({ to: email, subject, html, text });
};

/**
 * Template Email: Pemberitahuan Pendaftaran Pengguna Baru ke Admin
 */
export const sendNewUserAlertToAdmin = async (adminEmail, newUser) => {
  const subject = `[Digitech IMS] Permintaan Aktivasi Akun: ${newUser.full_name} (${newUser.company})`;
  const html = wrapEmailShell(`
    ${getEmailHeader('Permintaan Aktivasi Akun')}
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #0f172a; font-weight: 700;">
      Yth. Administrator Sistem,
    </p>
    <p style="margin: 0 0 14px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      Terdapat pengajuan pendaftaran akun baru pada portal Digitech IMS yang memerlukan pemeriksaan dan persetujuan Anda:
    </p>
    ${buildKvTable([
      ['Nama Lengkap', newUser.full_name],
      ['Alamat Email', newUser.email],
      ['Perusahaan / Mitra', newUser.company || '-'],
      ['Departemen', newUser.department || '-'],
      ['No. Telepon / WA', newUser.phone || '-']
    ])}
    <p style="margin: 14px 0 0 0; font-size: 13px; color: #475569; line-height: 1.6;">
      Silakan buka menu <strong>Kelola User &gt; Antrean Aktivasi</strong> pada portal untuk menindaklanjuti pengajuan ini.
    </p>
    ${getEmailFooter('Notifikasi administrator portal Digitech Inventory Management System.')}
  `);
  return sendEmail({
    to: adminEmail,
    subject,
    html,
    text: `Permintaan aktivasi akun baru: ${newUser.full_name} (${newUser.email}) - ${newUser.company || '-'}.`
  });
};

/**
 * Template Email: Pembaruan Status Dokumen Material On Site (MOS)
 */
export const sendMosNotificationEmail = async (email, docNumber, status, actionBy, notes = '') => {
  const isCompleted = status === 'completed';
  const statusLabel = isCompleted ? 'Selesai / Disahkan' : status;
  const subject = isCompleted
    ? `[Digitech IMS] Dokumen ${docNumber} Telah Disahkan`
    : `[Digitech IMS] Pembaruan Status Dokumen ${docNumber}`;

  const html = wrapEmailShell(`
    ${getEmailHeader('Status Dokumen Material')}
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #0f172a; font-weight: 700;">
      Pembaruan Status Dokumen Operasional
    </p>
    <p style="margin: 0 0 14px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      Berikut adalah rincian pembaruan status pemrosesan dokumen pada portal Digitech IMS:
    </p>
    ${buildKvTable([
      ['Nomor Dokumen', `<strong>${docNumber}</strong>`],
      ['Diproses Oleh', actionBy || '-'],
      ['Status Dokumen', `<strong style="color: ${isCompleted ? '#15803d' : '#b91c1c'};">${statusLabel}</strong>`]
    ])}
    ${notes ? `
      <div style="background-color: #fef2f2; border-left: 3px solid #b91c1c; padding: 10px 14px; margin: 14px 0; font-size: 13px; color: #7f1d1d;">
        <strong>Catatan:</strong> ${notes}
      </div>
    ` : ''}
    <p style="margin: 14px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.6;">
      Detail lengkap serta salinan lembar dokumen dapat diakses melalui menu Dokumen &amp; Laporan di portal.
    </p>
    ${getEmailFooter()}
  `);
  return sendEmail({
    to: email,
    subject,
    html,
    text: `Pembaruan status dokumen ${docNumber}: ${statusLabel}. Diproses oleh: ${actionBy}.${notes ? ` Catatan: ${notes}` : ''}`
  });
};

/**
 * Template Email: Pemberitahuan Perubahan Pengaturan Akun & Keamanan
 */
export const sendAccountSettingsChangeEmail = async (email, fullName, changeType, details = '') => {
  const subject = `[Digitech IMS] Pemberitahuan Perubahan Pengaturan Akun`;
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' });

  const html = wrapEmailShell(`
    ${getEmailHeader('Keamanan Akun')}
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #0f172a; font-weight: 700;">
      Yth. ${fullName},
    </p>
    <p style="margin: 0 0 14px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      Sistem mencatat adanya perubahan pada pengaturan akun Anda di portal Digitech Inventory Management System:
    </p>
    ${buildKvTable([
      ['Jenis Aktivitas', `<strong style="color: #b91c1c;">${changeType}</strong>`],
      ['Waktu (WITA)', `${timestamp} WITA`],
      ...(details ? [['Keterangan', details]] : [])
    ])}
    <p style="margin: 14px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.6;">
      Apabila Anda tidak merasa melakukan perubahan ini, segera hubungi administrator sistem atau perbarui kata sandi akun Anda.
    </p>
    ${getEmailFooter()}
  `);
  const text = `Yth. ${fullName}, terdapat perubahan pengaturan akun (${changeType}) pada ${timestamp} WITA.`;
  return sendEmail({ to: email, subject, html, text });
};

/**
 * Template Email: Pemberitahuan Agenda & Jadwal Operasional Site
 */
export const sendAgendaNotificationEmail = async (email, { title, date, time, site, pic, category, description, actionType = 'dijadwalkan' }) => {
  const subject = `[Digitech IMS] Agenda Site: ${title} (${date})`;
  const html = wrapEmailShell(`
    ${getEmailHeader('Agenda Operasional Site')}
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #0f172a; font-weight: 700;">
      Pemberitahuan Jadwal Operasional
    </p>
    <p style="margin: 0 0 14px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      Agenda kegiatan berikut telah <strong>${actionType}</strong> pada kalender operasional site:
    </p>
    ${buildKvTable([
      ['Nama Agenda', `<strong>${title}</strong>`],
      ['Tanggal', date],
      ['Waktu', time || '08:00 - Selesai'],
      ['Lokasi / Site', site || 'Site Operasional'],
      ['Kategori', category || 'Operasional'],
      ['Penanggung Jawab', pic || 'Tim Operasional']
    ])}
    ${description ? `
      <div style="background-color: #f8fafc; border-left: 3px solid #64748b; padding: 10px 14px; margin: 14px 0; font-size: 12px; color: #334155; line-height: 1.6;">
        <strong>Catatan Kegiatan:</strong><br/>${description}
      </div>
    ` : ''}
    <p style="margin: 14px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.6;">
      Silakan buka menu <strong>Agenda Kerja</strong> pada portal untuk melihat rincian jadwal.
    </p>
    ${getEmailFooter()}
  `);
  const text = `Agenda Site: ${title} pada tanggal ${date} (${time || '08:00 - Selesai'}) di ${site || 'Site Operasional'}. PIC: ${pic || 'Tim Operasional'}.`;
  return sendEmail({ to: email, subject, html, text });
};

/**
 * Template Email: Kode Verifikasi Dua Langkah (2FA)
 */
export const sendTwoFactorOtpEmail = async (email, fullName, otpCode) => {
  const subject = `[Digitech IMS] Kode Verifikasi Masuk: ${otpCode}`;
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' });

  const html = wrapEmailShell(`
    ${getEmailHeader('Verifikasi Masuk (2FA)')}
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #0f172a; font-weight: 700;">
      Yth. ${fullName || 'Pengguna'},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      Gunakan 6 digit kode verifikasi berikut untuk menyelesaikan proses masuk ke portal Digitech Inventory Management System:
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin: 18px auto; text-align: center; max-width: 300px;">
      <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #b91c1c; font-family: monospace;">
        ${otpCode}
      </div>
      <div style="margin-top: 8px; font-size: 11px; color: #64748b;">
        Berlaku selama 5 menit untuk satu kali penggunaan
      </div>
    </div>
    <div style="background-color: #fef2f2; border-left: 3px solid #b91c1c; padding: 10px 14px; margin: 16px 0 0 0; font-size: 12px; color: #7f1d1d; line-height: 1.5;">
      <strong>Perhatian:</strong> Jangan bagikan kode ini kepada pihak mana pun. Jika Anda tidak melakukan permintaan masuk pada ${timestamp} WITA, segera ubah kata sandi akun Anda.
    </div>
    ${getEmailFooter()}
  `);
  const text = `Kode verifikasi 2FA Digitech IMS Anda: ${otpCode}. Berlaku selama 5 menit.`;
  return sendEmail({ to: email, subject, html, text });
};
