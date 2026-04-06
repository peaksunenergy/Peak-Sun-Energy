const express = require('express');
const supabase = require('../db/pool');

const router = express.Router();

// GET /api/contact
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data.map(formatMessage));
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({ full_name: fullName, email, phone, message })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(formatMessage(data));
  } catch (err) {
    console.error('Submit message error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

function formatMessage(row) {
  return {
    id: String(row.id),
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    createdAt: row.created_at,
  };
}

module.exports = router;
