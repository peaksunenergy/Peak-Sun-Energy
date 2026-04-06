const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

// Warn if anon key is used instead of service_role
try {
  const payload = JSON.parse(Buffer.from(process.env.SUPABASE_SERVICE_KEY.split('.')[1], 'base64').toString());
  if (payload.role === 'anon') {
    console.error('WARNING: You are using the anon key. Use the service_role key from Supabase Dashboard > Settings > API.');
  }
} catch (_) { /* ignore parse errors */ }

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = supabase;
