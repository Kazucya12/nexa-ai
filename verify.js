const nodemailer = require('nodemailer');
const crypto = require('crypto');

const { CODE_SECRET, GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
const sign = (email, exp, code) =>
  crypto.createHmac('sha256', CODE_SECRET).update(email + '|' + exp + '|' + code).digest('hex');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const email = String(b.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Email tidak valid.' });
    if (!CODE_SECRET || !GMAIL_USER || !GMAIL_APP_PASSWORD)
      return res.status(500).json({ error: 'Server belum dikonfigurasi (Environment Variables belum diisi).' });

    if (b.action === 'send') {
      const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
      const exp = Date.now() + 10 * 60 * 1000;
      const mail = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } });
      await mail.sendMail({
        from: 'Nexa AI <' + GMAIL_USER + '>',
        to: email,
        subject: 'Kode verifikasi Nexa: ' + code,
        text: 'Kode verifikasi Nexa kamu: ' + code + '\nBerlaku 10 menit. Abaikan email ini jika bukan kamu.',
        html: '<div style="font-family:sans-serif"><h2>Nexa AI</h2><p>Kode verifikasi kamu:</p><p style="font-size:30px;letter-spacing:6px;font-weight:bold">' + code + '</p><p>Berlaku 10 menit. Abaikan email ini jika bukan kamu.</p></div>',
      });
      return res.status(200).json({ token: exp + '.' + sign(email, exp, code) });
    }

    if (b.action === 'check') {
      const [exp, sig] = String(b.token || '').split('.');
      if (!exp || !sig || Date.now() > Number(exp)) return res.status(400).json({ error: 'Kode kedaluwarsa. Kirim ulang kode.' });
      const good = Buffer.from(sign(email, exp, String(b.code || '').trim()));
      const got = Buffer.from(sig);
      if (good.length !== got.length || !crypto.timingSafeEqual(good, got)) return res.status(400).json({ error: 'Kode salah.' });
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'Aksi tidak dikenal.' });
  } catch (e) {
    return res.status(500).json({ error: 'Gagal memproses (cek GMAIL_USER dan App Password).' });
  }
};
