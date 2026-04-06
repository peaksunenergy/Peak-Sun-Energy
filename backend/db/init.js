const pool = require('./pool');
const bcrypt = require('bcrypt');

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  login         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'client',
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id              SERIAL PRIMARY KEY,
  user_id         INT REFERENCES users(id) ON DELETE CASCADE,
  phone           VARCHAR(20),
  location        VARCHAR(255),
  usage           VARCHAR(50),
  power           VARCHAR(50),
  characteristics TEXT,
  state           VARCHAR(30) DEFAULT 'pending',
  remark          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_requests (
  id          SERIAL PRIMARY KEY,
  full_name   VARCHAR(200) NOT NULL,
  email       VARCHAR(200),
  phone       VARCHAR(20),
  client_type VARCHAR(50),
  message     TEXT,
  status      VARCHAR(30) DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id         SERIAL PRIMARY KEY,
  full_name  VARCHAR(200) NOT NULL,
  email      VARCHAR(200),
  phone      VARCHAR(20),
  message    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claims (
  id          SERIAL PRIMARY KEY,
  client_id   INT REFERENCES clients(id) ON DELETE CASCADE,
  client_name VARCHAR(200),
  type        VARCHAR(30) NOT NULL,
  description TEXT,
  photo_uri   TEXT,
  status      VARCHAR(30) DEFAULT 'created',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  type       VARCHAR(50),
  claim_id   INT,
  message    TEXT,
  for_roles  TEXT[],
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function init() {
  console.log('Creating tables...');
  await pool.query(schema);

  // Seed demo users
  const adminHash = await bcrypt.hash('admin123', 10);
  const techHash = await bcrypt.hash('tech123', 10);
  const clientHash = await bcrypt.hash('client123', 10);

  await pool.query(`
    INSERT INTO users (login, password_hash, role, first_name, last_name)
    VALUES
      ('admin',   $1, 'admin',      'Nesrine',  'Gérante'),
      ('tech1',   $2, 'technician', 'Ahmed',    'Technicien'),
      ('client1', $3, 'client',     'Mohamed',  'Ben Ali')
    ON CONFLICT (login) DO NOTHING
  `, [adminHash, techHash, clientHash]);

  // Seed demo client
  await pool.query(`
    INSERT INTO clients (user_id, phone, location, usage, power, characteristics, state, remark)
    SELECT u.id, '55123456', 'Tunis', 'Résidentiel', '3 kW',
           'Panneaux monocristallins + onduleur', 'in_progress', 'Installation en cours'
    FROM users u WHERE u.login = 'client1'
    ON CONFLICT DO NOTHING
  `);

  console.log('Database initialized successfully!');
  await pool.end();
}

init().catch((err) => {
  console.error('Init failed:', err);
  process.exit(1);
});
