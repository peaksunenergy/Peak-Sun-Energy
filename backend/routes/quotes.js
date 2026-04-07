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
    const { firstName, lastName, phone, clientType, serviceType, location, power, stegAmount, stegPower } = req.body;
    const { data, error } = await supabase
      .from('quote_requests')
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone,
        client_type: clientType,
        service_type: serviceType,
        location,
        power,
        steg_amount: stegAmount,
        steg_power: stegPower,
        status: 'pending',
      })
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
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    clientType: row.client_type,
    serviceType: row.service_type,
    location: row.location,
    power: row.power,
    stegAmount: row.steg_amount,
    stegPower: row.steg_power,
    status: row.status,
    createdAt: row.created_at,
  };
}

module.exports = router;
