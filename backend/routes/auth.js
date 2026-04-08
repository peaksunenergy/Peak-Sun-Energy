const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const supabase = require('../db/pool');
const { generateToken } = require('../middleware/auth');
const { sendVerificationEmail } = require('../services/email');

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
