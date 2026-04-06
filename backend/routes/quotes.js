const express = require('express');
const supabase = require('../db/pool');

const router = express.Router();

// GET /api/quotes
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data.map(formatQuote));
  } catch (err) {
    console.error('Get quotes error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/quotes
router.post('/', async (req, res) => {
  try {
    const { fullName, email, phone, clientType, message } = req.body;
    const { data, error } = await supabase
      .from('quote_requests')
      .insert({ full_name: fullName, email, phone, client_type: clientType, message, status: 'pending' })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(formatQuote(data));
  } catch (err) {
    console.error('Submit quote error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

function formatQuote(row) {
  return {
    id: String(row.id),
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    clientType: row.client_type,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

module.exports = router;
