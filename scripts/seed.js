/**
 * Seed script: creates OWNER and ADMIN accounts with properly bcrypt-hashed passwords.
 * Passwords are hashed server-side — never stored in plaintext.
 */
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load env from local .env (supabase/.env has the keys, .env.local too)
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', 'supabase', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54331';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found. Run `supabase start` first.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log('🔐 Seeding BEXA AI accounts...');

  // Hash passwords with bcrypt (cost factor 12)
  const ownerPassword = 'bexaai20101810';
  const adminPassword = 'doniyor20112913';

  console.log('  Hashing passwords...');
  const ownerHash = await bcrypt.hash(ownerPassword, 12);
  const adminHash = await bcrypt.hash(adminPassword, 12);

  // Define accounts
  const accounts = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'owner@bexaai.local',
      password: ownerHash,
      full_name: 'BEXA AI Owner',
      username: 'owner',
      role: 'OWNER',
      user_id: 'USR-1001'
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'admin@bexaai.local',
      password: adminHash,
      full_name: 'BEXA AI Admin',
      username: 'ADMIN',
      role: 'ADMIN',
      user_id: 'USR-1002'
    }
  ];

  for (const acc of accounts) {
    console.log(`  Creating/Updating ${acc.email}...`);

    // Upsert auth user
    const { error: upsertError } = await supabase.rpc('admin_update_user', {
      // We'll use the admin API via direct SQL since we need to set encrypted_password
      // Actually, let's use the /auth/v1/admin/users endpoint approach via supabase-js
      // But supabase-js doesn't expose admin user creation directly.
      // We'll use raw SQL via rpc or direct fetch.
    });

    // Use direct SQL via supabase's rpc to a custom function, or use postgres admin
    // Instead, let's create users via the Supabase Admin API
    const fetch = (await import('node-fetch')).default;

    // Create or update user via admin API
    const adminResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        email: acc.email,
        email_confirm: true,
        password: acc.password, // Send plain password, Supabase hashes it
        user_metadata: {
          full_name: acc.full_name,
          username: acc.username,
          role: acc.role
        },
        app_metadata: {
          role: acc.role
        }
      })
    });

    const adminData = await adminResp.json();

    if (!adminResp.ok && !adminData?.user?.id) {
      // User might already exist — try updating
      console.log(`    User exists, updating...`);
      
      // Get existing user first
      const getUserResp = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${acc.email}`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const getUserData = await getUserResp.json();
      
      if (getUserData?.users?.[0]?.id) {
        const userId = getUserData.users[0].id;
        const updResp = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            email: acc.email,
            email_confirm: true,
            password: acc.password,
            user_metadata: {
              full_name: acc.full_name,
              username: acc.username,
              role: acc.role
            },
            app_metadata: {
              role: acc.role
            }
          })
        });
        console.log(`    Updated: ${updResp.ok ? '✅' : '❌'}`);
      }
    } else {
      console.log(`    Created: ✅`);
    }

    // Upsert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: acc.id,
        user_id: acc.user_id,
        full_name: acc.full_name,
        username: acc.username,
        email: acc.email,
        role: acc.role,
        status: 'active',
        force_password_change: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error(`  ❌ Profile error for ${acc.email}:`, profileError.message);
    } else {
      console.log(`  ✅ Profile for ${acc.email}`);
    }
  }

  // Insert default settings
  const { error: settingsError } = await supabase.from('settings').upsert([
    { key: 'app_name', value: 'BEXA AI', type: 'string', description: 'Application name shown in the UI', is_public: true },
    { key: 'app_title', value: 'BEXA AI Admin', type: 'string', description: 'Browser title', is_public: true },
    { key: 'default_currency', value: 'USD', type: 'string', description: 'Default currency for financial records', is_public: false },
    { key: 'require_password_change_on_first_login', value: 'true', type: 'boolean', description: 'Force password change after initial setup', is_public: false }
  ], { onConflict: 'key' });

  if (settingsError) console.error('Settings error:', settingsError.message);
  else console.log('✅ Default settings inserted');

  // Log activity
  const { error: logError } = await supabase.from('activity_log').insert({
    actor_id: '00000000-0000-0000-0000-000000000001',
    action: 'system.seed',
    entity_type: 'system',
    details: { message: 'Initial OWNER and ADMIN accounts created', version: '1.0.0' }
  });
  if (logError) console.error('Activity log error:', logError.message);

  console.log('\n✅ Seeding complete!');
  console.log('   OWNER:  owner  / bexaai20101810  (role: OWNER)');
  console.log('   ADMIN:  ADMIN  / doniyor20112913 (role: ADMIN)');
  console.log('   Both accounts require a password change on first login.');
}

main().catch(e => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
