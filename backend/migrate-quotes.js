// Quick migration: add columns to quote_requests
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function migrate() {
  // Try updating a non-existent row to see if columns exist
  const { error } = await supabase
    .from('quote_requests')
    .update({ assigned_to: null, assigned_name: null, updated_at: new Date().toISOString() })
    .eq('id', -1);

  if (error && error.message.includes('column')) {
    console.log('Columns missing. Please run this SQL in Supabase Dashboard > SQL Editor:\n');
    console.log(`ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS assigned_to INTEGER;`);
    console.log(`ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS assigned_name TEXT;`);
    console.log(`ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`);
    console.log('\nThen re-run this script to verify.');
  } else {
    console.log('All columns exist. Migration OK.');
  }
}

migrate();
