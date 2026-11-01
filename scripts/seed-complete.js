/**
 * BEXA AI — Complete Seed Script
 * Creates OWNER and ADMIN accounts with properly hashed passwords.
 * Run: `node scripts/seed-complete.js` after `supabase db reset`
 */

const dotenv = require('dotenv');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', 'supabase', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54331';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found. Run `supabase start` first.');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

// node-fetch for direct GoTrue admin API calls (the JS SDK in v2.118 has limited admin methods)
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function adminFetch(endpoint, { method = 'GET', body } = {}) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${supabaseUrl}/auth/v1/admin${endpoint}`, opts);
  const data = await res.json();
  return { res, data };
}

async function main() {
  console.log('🔐 Seeding BEXA AI accounts...\n');

  const accounts = [
    {
      email: 'owner@bexaai.local',
      password: 'bexaai20101810',
      full_name: 'BEXA AI Owner',
      username: 'owner',
      role: 'OWNER',
      user_id: 'USR-1001',
    },
    {
      email: 'admin@bexaai.local',
      password: 'doniyor20112913',
      full_name: 'BEXA AI Admin',
      username: 'ADMIN',
      role: 'ADMIN',
      user_id: 'USR-1002',
    },
  ];

  for (const acc of accounts) {
    console.log(`  Processing ${acc.email}...`);

    // Check if user exists via list endpoint
    const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(acc.email)}`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    const listData = await listRes.json();
    const found = (listData.users || []).find((u) => u.email === acc.email);

    let userId;

    if (found) {
      // Update existing user
      const { res, data } = await adminFetch(`/users/${found.id}`, {
        method: 'PUT',
        body: {
          email: acc.email,
          password: acc.password,
          email_confirm: true,
          user_metadata: { full_name: acc.full_name, username: acc.username, role: acc.role },
          app_metadata: { role: acc.role },
        },
      });

      if (!res.ok) {
        console.error(`  ❌ Update error for ${acc.email}:`, data.error || data.message);
        continue;
      }
      userId = data.id || data.user?.id;
      console.log(`  ✅ Updated user (ID: ${userId})`);
    } else {
      // Create new user
      const { res, data } = await adminFetch('/users', {
        method: 'POST',
        body: {
          email: acc.email,
          password: acc.password,
          email_confirm: true,
          user_metadata: { full_name: acc.full_name, username: acc.username, role: acc.role },
          app_metadata: { role: acc.role },
        },
      });

      if (!res.ok) {
        console.error(`  ❌ Create error for ${acc.email}:`, data.error || data.message);
        continue;
      }
      userId = data.id || data.user?.id;
      console.log(`  ✅ Created user (ID: ${userId})`);
    }

    // Upsert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        user_id: acc.user_id,
        full_name: acc.full_name,
        username: acc.username,
        email: acc.email,
        role: acc.role,
        status: 'active',
        force_password_change: true,
        timezone: 'UTC',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) {
      console.error(`  ❌ Profile error for ${acc.email}:`, profileError.message);
    } else {
      console.log(`  ✅ Profile for ${acc.email}`);
    }
  }

  // Default settings
  const { error: settingsError } = await supabase.from('settings').upsert([
    { key: 'app_name', value: 'BEXA AI', type: 'string', description: 'Application name shown in the UI', is_public: true },
    { key: 'app_title', value: 'BEXA AI Admin', type: 'string', description: 'Browser title', is_public: true },
    { key: 'default_currency', value: 'USD', type: 'string', description: 'Default currency for financial records', is_public: false },
    { key: 'require_password_change_on_first_login', value: 'true', type: 'boolean', description: 'Force password change after initial setup', is_public: false },
  ], { onConflict: 'key' });

  if (settingsError) console.error('  ❌ Settings error:', settingsError.message);
  else console.log('  ✅ Default settings inserted');

  console.log('\n✅ Seeding complete!');
  console.log('   OWNER:  owner  / bexaai20101810  (role: OWNER)');
  console.log('   ADMIN:  ADMIN  / doniyor20112913 (role: ADMIN)');
}

main().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
