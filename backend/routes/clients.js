const express = require('express');
const bcrypt = require('bcrypt');
const supabase = require('../db/pool');

const router = express.Router();

// GET /api/clients
router.get('/', async (_req, res) => {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*, users(login, first_name, last_name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(clients.map(c => formatClient({ ...c, ...c.users })));
  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/clients
router.post('/', async (req, res) => {
  try {
    const { login, password, firstName, lastName, phone, location, usage, power, characteristics, remark } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({ login, password_hash: passwordHash, role: 'client', first_name: firstName, last_name: lastName })
      .select()
      .single();

    if (userError) {
      if (userError.code === '23505') {
        return res.status(409).json({ error: 'Ce login existe déjà' });
      }
      throw userError;
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({ user_id: user.id, phone, location, usage, power, characteristics, state: 'pending', remark })
      .select()
      .single();

    if (clientError) throw clientError;

    res.status(201).json(formatClient({ ...client, login, first_name: firstName, last_name: lastName }));
  } catch (err) {
    console.error('Add client error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, location, usage, power, characteristics, state, remark } = req.body;

    const { data: client, error } = await supabase
      .from('clients')
      .update({ phone, location, usage, power, characteristics, state, remark })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!client) return res.status(404).json({ error: 'Client non trouvé' });

    if (firstName || lastName) {
      const nameUpdates = {
        ...(firstName && { first_name: firstName }),
        ...(lastName && { last_name: lastName }),
      };
      await supabase
        .from('users')
        .update(nameUpdates)
        .eq('id', client.user_id);

      // Cascade: update client_name on all linked claims
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', client.user_id)
        .single();
      if (userData) {
        const fullName = `${userData.first_name} ${userData.last_name}`;
        await supabase
          .from('claims')
          .update({ client_name: fullName })
          .eq('client_id', id);
      }
    }

    // Re-fetch with user data for response
    const { data: updated } = await supabase
      .from('clients')
      .select('*, users(login, first_name, last_name)')
      .eq('id', id)
      .single();
    res.json(formatClient({ ...updated, ...updated.users }));
  } catch (err) {
    console.error('Update client error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    // Delete linked claim_history entries first (via claims)
    const { data: claimRows } = await supabase
      .from('claims')
      .select('id')
      .eq('client_id', req.params.id);

    if (claimRows && claimRows.length > 0) {
      const claimIds = claimRows.map(c => c.id);
      await supabase.from('claim_history').delete().in('claim_id', claimIds);
      await supabase.from('notifications').delete().in('claim_id', claimIds);
    }

    // Delete claims linked to this client
    await supabase.from('claims').delete().eq('client_id', req.params.id);

    // Delete client row and get user_id
    const { data: client, error } = await supabase
      .from('clients')
      .delete()
      .eq('id', req.params.id)
      .select('user_id')
      .single();

    if (error || !client) return res.status(404).json({ error: 'Client non trouvé' });

    // Delete user account
    await supabase.from('users').delete().eq('id', client.user_id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete client error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/clients/:id/installation — :id is the user_id (from auth)
router.get('/:id/installation', async (req, res) => {
  try {
    const { data: client, error } = await supabase
      .from('clients')
      .select('*, users(login, first_name, last_name)')
      .eq('user_id', parseInt(req.params.id))
      .single();

    if (error || !client) return res.json(null);

    res.json(formatClient({ ...client, ...client.users }));
  } catch (err) {
    console.error('Get installation error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

function formatClient(row) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    login: row.login,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    location: row.location,
    usage: row.usage,
    power: row.power,
    characteristics: row.characteristics,
    state: row.state,
    remark: row.remark,
    createdAt: row.created_at,
  };
}

module.exports = router;
