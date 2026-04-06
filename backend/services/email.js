const nodemailer = require('nodemailer');

// Configure transporter — uses SMTP settings from .env
// For Gmail: enable "App Passwords" in Google Account settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEscalationEmail(claim) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !process.env.SMTP_USER) {
    console.log('Email not configured — skipping escalation email for claim', claim.id);
    return;
  }

  const typeLabel = claim.type === 'technical' ? 'Technique' : 'Administrative';

  await transporter.sendMail({
    from: `"Peak Sun Energy" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `⚠️ Escalade — Réclamation #${claim.id} non traitée (+48h)`,
    html: `
      <h2>⚠️ Réclamation non traitée depuis plus de 48 heures</h2>
      <table style="border-collapse:collapse; margin:16px 0;">
        <tr><td style="padding:8px; font-weight:bold;">Réclamation #</td><td style="padding:8px;">${claim.id}</td></tr>
        <tr><td style="padding:8px; font-weight:bold;">Client</td><td style="padding:8px;">${claim.client_name}</td></tr>
        <tr><td style="padding:8px; font-weight:bold;">Type</td><td style="padding:8px;">${typeLabel}</td></tr>
        <tr><td style="padding:8px; font-weight:bold;">Description</td><td style="padding:8px;">${claim.description || 'N/A'}</td></tr>
        <tr><td style="padding:8px; font-weight:bold;">Assigné à</td><td style="padding:8px;">${claim.assigned_name || 'Non assigné'}</td></tr>
        <tr><td style="padding:8px; font-weight:bold;">Créée le</td><td style="padding:8px;">${new Date(claim.created_at).toLocaleString('fr-FR')}</td></tr>
      </table>
      <p>Veuillez prendre les mesures nécessaires.</p>
      <p style="color:#888; font-size:12px;">— Peak Sun Energy System</p>
    `,
  });

  console.log(`Escalation email sent for claim #${claim.id}`);
}

module.exports = { sendEscalationEmail };
