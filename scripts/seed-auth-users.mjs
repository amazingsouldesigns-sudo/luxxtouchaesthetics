// ============================================================
// Seed auth users into a fresh Supabase project.
//
// Recreates the two original accounts using the Supabase Admin API.
// The on_auth_user_created trigger then creates the matching
// profile + role automatically (owner email -> admin, others -> customer).
//
// Usage (PowerShell):
//   $env:SUPABASE_URL="https://YOUR_REF.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
//   node scripts/seed-auth-users.mjs
//
// Each account is created with email confirmed and a random temporary
// password. Have each person use "Forgot password" on the site to set
// their own password (the owner especially).
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Accounts to recreate. The owner email is auto-granted admin by the
// on_auth_user_created trigger defined in the schema migration.
const USERS = [
  { email: 'luxxtouch1@gmail.com', full_name: 'Adena Chambers' },
  { email: 'adena.chambers12@gmail.com', full_name: 'Adena Chambers' },
]

function tempPassword() {
  // 24-char URL-safe temporary password
  return randomBytes(18).toString('base64url')
}

async function ensureUser({ email, full_name }) {
  const password = tempPassword()
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (error) {
    // Treat already-existing accounts as success (idempotent re-runs).
    if (/already|exists|registered/i.test(error.message)) {
      console.log(`= ${email} already exists — skipped.`)
      return
    }
    console.error(`x ${email} failed: ${error.message}`)
    return
  }

  console.log(`+ created ${email}`)
  console.log(`  temporary password: ${password}`)
  console.log(`  (use "Forgot password" on the site to set a permanent one)`)
  void data
}

for (const user of USERS) {
  // eslint-disable-next-line no-await-in-loop
  await ensureUser(user)
}

console.log('\nDone. Profiles and roles are created automatically by the database trigger.')
