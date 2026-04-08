// Brevo (formerly Sendinblue) — free 300 emails/day to ANY recipient
// Uses HTTPS API — works on any network, no SMTP ports needed
// Sign up at https://brevo.com → SMTP & API → API Keys

function getConfig() {
  return {
    apiKey: process.env.BREVO_API_KEY,
    senderEmail: process.env.SENDER_EMAIL || 'peaksunenergy23@gmail.com',
    senderName: process.env.SENDER_NAME || 'Peak Sun Energy',
  };
}

async function sendEmail({ to, subject, html }) {
  const { apiKey, senderEmail, senderName } = getConfig();
  if (!apiKey) {
    console.log('BREVO_API_KEY not set — skipping email to', to);
    return;
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Brevo error: ${res.status} — ${body.message || JSON.stringify(body)}`);
  }

  return res.json();
}

async function sendEscalationEmail(claim) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.log('ADMIN_EMAIL not set — skipping escalation email for claim', claim.id);
    return;
  }

  const typeLabel = claim.type === 'technical' ? 'Technique' : 'Administrative';

  await sendEmail({
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

async function sendVerificationEmail(email, firstName, token) {
  const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Validez votre compte — Peak Sun Energy',
    html: `
      <div style="font-family:Arial,sans-serif; max-width:500px; margin:0 auto;">
        <h2 style="color:#F97316;">Bienvenue, ${firstName} !</h2>
        <p>Merci de vous être inscrit sur <strong>Peak Sun Energy</strong>.</p>
        <p>Cliquez sur le bouton ci-dessous pour valider votre adresse email :</p>
        <div style="text-align:center; margin:24px 0;">
          <a href="${verifyUrl}" style="background:#F97316; color:#fff; padding:12px 32px; border-radius:8px; text-decoration:none; font-weight:bold;">
            Valider mon email
          </a>
        </div>
        <p style="color:#888; font-size:12px;">Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.</p>
        <p style="color:#888; font-size:12px;">— Peak Sun Energy</p>
      </div>
    `,
  });

  console.log(`Verification email sent to ${email}`);
}

async function sendPasswordResetEmail(email, firstName, token) {
  const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const resetUrl = `${baseUrl}/api/auth/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Réinitialisation de mot de passe — Peak Sun Energy',
    html: `
      <div style="font-family:Arial,sans-serif; max-width:500px; margin:0 auto;">
        <h2 style="color:#F97316;">Réinitialisation de mot de passe</h2>
        <p>Bonjour ${firstName},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
        <div style="text-align:center; margin:24px 0;">
          <a href="${resetUrl}" style="background:#F97316; color:#fff; padding:12px 32px; border-radius:8px; text-decoration:none; font-weight:bold;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color:#888; font-size:12px;">Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        <p style="color:#888; font-size:12px;">— Peak Sun Energy</p>
      </div>
    `,
  });

  console.log(`Password reset email sent to ${email}`);
}

module.exports = { sendEscalationEmail, sendVerificationEmail, sendPasswordResetEmail };
