const SUPABASE_URL = "https://sujhvkqcbegkbapjxypd.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1amh2a3FjYmVna2JhcGp4eXBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzUwMTQ4MywiZXhwIjoyMTA5MDc3NDgzfQ.oHq1tF-644R8qWYXwiw6g8kj_64AD1LnAILm41hA3IU";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1amh2a3FjYmVna2JhcGp4eXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1MDE0ODMsImV4cCI6MjEwOTA3NzQ4M30.A4F0W7tEFxwdGC31HpEdKL-1BOxN6hzdRNkWPex_Knw";

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createUser(email, password, metadata) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "apikey": SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    }),
  });
  const data = await res.json();
  if (data.error || data.msg) {
    console.error("Auth error:", data.error || data.msg);
    return null;
  }
  return data;
}

async function main() {
  // Create OWNER
  console.log("Creating OWNER account...");
  const owner = await createUser("owner@bexaai.local", "bexaai20101810", {
    full_name: "BEXA AI Owner",
    username: "owner",
    role: "OWNER",
  });
  if (owner) {
    console.log("OWNER created:", owner.id);
    // Create profile
    await supabase.from("profiles").insert({
      id: owner.id,
      user_id: "USR-1001",
      full_name: "BEXA AI Owner",
      username: "owner",
      email: "owner@bexaai.local",
      role: "OWNER",
      status: "active",
      force_password_change: true,
    });
    console.log("OWNER profile created");
  }

  // Create ADMIN
  console.log("Creating ADMIN account...");
  const admin = await createUser("admin@bexaai.local", "doniyor20112913", {
    full_name: "BEXA AI Admin",
    username: "ADMIN",
    role: "ADMIN",
  });
  if (admin) {
    console.log("ADMIN created:", admin.id);
    await supabase.from("profiles").insert({
      id: admin.id,
      user_id: "USR-1002",
      full_name: "BEXA AI Admin",
      username: "ADMIN",
      email: "admin@bexaai.local",
      role: "ADMIN",
      status: "active",
      force_password_change: true,
    });
    console.log("ADMIN profile created");
  }

  // Insert default settings
  console.log("Inserting default settings...");
  const settings = [
    { key: "app_name", value: "BEXA AI", type: "string", description: "Application name shown in the UI", is_public: true },
    { key: "app_title", value: "BEXA AI Admin", type: "string", description: "Browser tab title", is_public: true },
    { key: "default_currency", value: "USD", type: "string", description: "Default currency for transactions", is_public: false },
    { key: "items_per_page", value: "20", type: "number", description: "Default items per page in tables", is_public: false },
    { key: "require_password_change_on_first_login", value: "true", type: "boolean", description: "Force new users to change password on first login", is_public: false },
  ];
  for (const s of settings) {
    await supabase.from("settings").upsert(s);
  }
  console.log("Settings inserted");

  console.log("Done!");
}

main().catch(console.error);
