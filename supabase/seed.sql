-- BEXA AI — Seed file
-- The actual OWNER and ADMIN accounts are created via the `node scripts/seed-complete.js`
-- script which uses the Supabase Admin API to properly hash passwords with bcrypt.
-- This file is intentionally minimal — real auth users should not be created via raw SQL
-- because password hashing must go through Supabase Auth.

-- Default settings
insert into public.settings (key, value, type, description, is_public)
values
  ('app_name', 'BEXA AI', 'string', 'Application name shown in the UI', true),
  ('app_title', 'BEXA AI Admin', 'string', 'Browser title', true),
  ('default_currency', 'USD', 'string', 'Default currency for financial records', false),
  ('require_password_change_on_first_login', 'true', 'boolean', 'Force password change after initial setup', false)
on conflict (key) do update set value = excluded.value;
