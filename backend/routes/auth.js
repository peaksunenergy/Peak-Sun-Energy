const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const supabase = require('../db/pool');
const { generateToken } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;

    if (!firstName || !lastName || !email || !phone || !password || !role) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const allowedRoles = ['client', 'technician', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Un compte avec cet email existe déjà' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        login: email,
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        phone,
        role,
        email_verified: false,
        verification_token: verificationToken,
        verification_token_expires: tokenExpiry,
      })
      .select()
      .single();

    if (error) throw error;

    // Create matching client record if role is client
    if (role === 'client') {
      await supabase
        .from('clients')
        .insert({ user_id: user.id, phone, state: 'pending' });
    }

    // Send verification email
    await sendVerificationEmail(email, firstName, verificationToken).catch(err =>
      console.error('Failed to send verification email:', err.message)
    );

    res.status(201).json({ message: 'Compte créé. Vérifiez votre email pour activer votre compte.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/auth/verify-email?token=xxx
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(verificationPage('Lien invalide.', false));
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email_verified, verification_token_expires')
      .eq('verification_token', token)
      .single();

    if (error || !user) {
      return res.status(400).send(verificationPage('Lien invalide ou déjà utilisé.', false));
    }

    if (user.email_verified) {
      return res.send(verificationPage('Votre email est déjà vérifié. Vous pouvez vous connecter.', true));
    }

    if (new Date(user.verification_token_expires) < new Date()) {
      return res.status(400).send(verificationPage('Ce lien a expiré. Veuillez vous réinscrire.', false));
    }

    await supabase
      .from('users')
      .update({ email_verified: true, verification_token: null, verification_token_expires: null })
      .eq('id', user.id);

    res.send(verificationPage('Email vérifié avec succès ! Vous pouvez maintenant vous connecter.', true));
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).send(verificationPage('Erreur serveur. Réessayez plus tard.', false));
  }
});

function verificationPage(message, success) {
  const color = success ? '#22C55E' : '#EF4444';
  const icon = success ? '✅' : '❌';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Peak Sun Energy</title></head><body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5;">
    <div style="text-align:center;padding:40px;background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.1);max-width:400px;">
    <div style="font-size:48px;margin-bottom:16px;">${icon}</div>
    <h2 style="color:${color};margin-bottom:8px;">Peak Sun Energy</h2>
    <p style="color:#333;font-size:16px;">${message}</p>
    </div></body></html>`;
}

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "L'email est requis" });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, first_name, email')
      .eq('email', email)
      .single();

    // Always return success to avoid email enumeration
    if (!user) {
      return res.json({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await supabase
      .from('users')
      .update({ reset_token: resetToken, reset_token_expires: tokenExpiry })
      .eq('id', user.id);

    await sendPasswordResetEmail(user.email, user.first_name, resetToken).catch(err =>
      console.error('Failed to send reset email:', err.message)
    );

    res.json({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/auth/reset-password?token=xxx — show reset form
router.get('/reset-password', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send(resultPage('Lien invalide.', false));
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, reset_token_expires')
    .eq('reset_token', token)
    .single();

  if (!user) {
    return res.status(400).send(resultPage('Lien invalide ou déjà utilisé.', false));
  }

  if (new Date(user.reset_token_expires) < new Date()) {
    return res.status(400).send(resultPage('Ce lien a expiré. Veuillez refaire une demande.', false));
  }

  // Show password reset form
  res.send(resetFormPage(token));
});

// POST /api/auth/reset-password — handle form submission
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).send(resultPage('Données manquantes.', false));
    }

    if (password.length < 6) {
      return res.status(400).send(resultPage('Le mot de passe doit contenir au moins 6 caractères.', false));
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, reset_token_expires')
      .eq('reset_token', token)
      .single();

    if (!user) {
      return res.status(400).send(resultPage('Lien invalide ou déjà utilisé.', false));
    }

    if (new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).send(resultPage('Ce lien a expiré. Veuillez refaire une demande.', false));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await supabase
      .from('users')
      .update({ password_hash: passwordHash, reset_token: null, reset_token_expires: null })
      .eq('id', user.id);

    res.send(resultPage('Mot de passe modifié avec succès ! Vous pouvez maintenant vous connecter.', true));
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).send(resultPage('Erreur serveur. Réessayez plus tard.', false));
  }
});

function resetFormPage(token) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Peak Sun Energy — Nouveau mot de passe</title></head>
    <body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5;">
    <div style="text-align:center;padding:40px;background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.1);max-width:400px;width:90%;">
    <div style="font-size:48px;margin-bottom:16px;">🔒</div>
    <h2 style="color:#F97316;margin-bottom:16px;">Nouveau mot de passe</h2>
    <form method="POST" action="/api/auth/reset-password" style="text-align:left;">
      <input type="hidden" name="token" value="${token}" />
      <label style="display:block;margin-bottom:4px;font-weight:600;color:#333;">Nouveau mot de passe</label>
      <input type="password" name="password" minlength="6" required placeholder="Minimum 6 caractères"
        style="width:100%;padding:12px;border:1px solid #ccc;border-radius:8px;font-size:15px;margin-bottom:16px;box-sizing:border-box;" />
      <label style="display:block;margin-bottom:4px;font-weight:600;color:#333;">Confirmer</label>
      <input type="password" id="confirm" minlength="6" required placeholder="Retapez le mot de passe"
        style="width:100%;padding:12px;border:1px solid #ccc;border-radius:8px;font-size:15px;margin-bottom:16px;box-sizing:border-box;" />
      <p id="error" style="color:#EF4444;font-size:13px;display:none;margin-bottom:12px;">Les mots de passe ne correspondent pas</p>
      <button type="submit"
        style="width:100%;padding:14px;background:#F97316;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;">
        Réinitialiser
      </button>
    </form>
    <script>
      document.querySelector('form').addEventListener('submit', function(e) {
        var pw = document.querySelector('[name=password]').value;
        var c = document.getElementById('confirm').value;
        if (pw !== c) { e.preventDefault(); document.getElementById('error').style.display = 'block'; }
      });
    </script>
    </div></body></html>`;
}

function resultPage(message, success) {
  const color = success ? '#22C55E' : '#EF4444';
  const icon = success ? '✅' : '❌';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Peak Sun Energy</title></head><body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5;">
    <div style="text-align:center;padding:40px;background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.1);max-width:400px;">
    <div style="font-size:48px;margin-bottom:16px;">${icon}</div>
    <h2 style="color:${color};margin-bottom:8px;">Peak Sun Energy</h2>
    <p style="color:#333;font-size:16px;">${message}</p>
    </div></body></html>`;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('login', login)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Block unverified accounts (only for users who registered with email)
    if (user.email && user.email_verified === false) {
      return res.status(403).json({ error: 'Veuillez valider votre email avant de vous connecter.' });
    }

    const userData = {
      id: String(user.id),
      login: user.login,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    const token = generateToken(userData);

    res.json({ ...userData, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
