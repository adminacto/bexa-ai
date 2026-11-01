/**
 * BEXA AI — Database seed: creates profiles for OWNER and ADMIN accounts
 * Run after `supabase db reset` and `node scripts/seed.js`
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', 'supabase', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54331';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found. Run `supabase start` first.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔐 Creating user profiles...');

  // Get auth users
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const ownerUser = usersData.users.find(u => u.email === 'owner@bexaai.local');
  const adminUser = usersData.users.find(u => u.email === 'admin@bexaai.local');

  if (!ownerUser) throw new Error('OWNER auth user not found. Run node scripts/seed.js first.');
  if (!adminUser) throw new Error('ADMIN auth user not found. Run node scripts/seed.js first.');

  console.log('  OWNER user ID:', ownerUser.id);
  console.log('  ADMIN user ID:', adminUser.id);

  // Create/update profiles (must match auth.users id)
  const profiles = [
    {
      id: ownerUser.id,
      user_id: 'USR-1001',
      full_name: 'BEXA AI Owner',
      username: 'owner',
      email: 'owner@bexaai.local',
      role: 'OWNER',
      status: 'active',
      force_password_change: true,
    },
    {
      id: adminUser.id,
      user_id: 'USR-1002',
      full_name: 'BEXA AI Admin',
      username: 'ADMIN',
      email: 'admin@bexaai.local',
      role: 'ADMIN',
      status: 'active',
      force_password_change: true,
    },
  ];

  for (const prof of profiles) {
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        ...prof,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (upsertError) {
      console.error(`  ❌ Profile error for ${prof.email}:`, upsertError.message);
    } else {
      console.log(`  ✅ Profile created for ${prof.email}`);
    }
  }

  // Default settings
  const { error: settingsError } = await supabase.from('settings').upsert([
    { key: 'app_name', value: 'BEXA AI', type: 'string', description: 'Application name', is_public: true },
    { key: 'app_title', value: 'BEXA AI Admin', type: 'string', description: 'Browser title', is_public: true },
    { key: 'default_currency', value: 'USD', type: 'string', description: 'Default currency', is_public: false },
    { key: 'require_password_change_on_first_login', value: 'true', type: 'boolean', description: 'Force password change', is_public: false },
  ], { onConflict: 'key' });

  if (settingsError) console.error('Settings error:', settingsError.message);
  else console.log('✅ Default settings inserted');

  // Log activity
  const { error: logError } = await supabase.from('activity_log').insert({
    actor_id: ownerUser.id,
    action: 'system.seed',
    entity_type: 'system',
    details: { message: 'Initial OWNER and ADMIN accounts created', version: '1.0.0' },
  });

  if (logError) console.error('Activity log error:', logError.message);

  console.log('\n✅ Seeding complete!');
  console.log('   OWNER:  owner  / bexaai20101810  (role: OWNER)');
  console.log('   ADMIN:  ADMIN  / doniyor20112913 (role: ADMIN)');
}

main().catch(e => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
