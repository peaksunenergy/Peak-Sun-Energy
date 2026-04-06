const express = require('express');
const bcrypt = require('bcrypt');
const supabase = require('../db/pool');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

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
