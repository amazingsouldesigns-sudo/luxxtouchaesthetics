// ============================================================
// Set (reset) a user's login password in Supabase.
//
// Usage (PowerShell), from the project folder:
//   $env:SUPABASE_URL="https://YOUR_REF.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
//   node scripts/set-password.mjs
//
// By default this sets the password for luxxtouch1@gmail.com. Override with:
//   $env:TARGET_EMAIL="someone@example.com"
//   $env:NEW_PASSWORD="a-different-password"
//
// SECURITY: the default password below is a convenience for the owner. If this
// repo is ever made public, remove it and pass NEW_PASSWORD via env instead,
// then rotate the password from the Supabase dashboard.
// ============================================================

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TARGET_EMAIL = (process.env.TARGET_EMAIL || 'luxxtouch1@gmail.com').toLowerCase()
const NEW_PASSWORD = process.env.NEW_PASSWORD || 'LUXXTOUCH@69'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserByEmail(email) {
  // Small user base — page through until we find the match.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(error.message)
    const match = data.users.find((u) => (u.email || '').toLowerCase() === email)
    if (match) return match
    if (data.users.length < 200) break
  }
  return null
}

const user = await findUserByEmail(TARGET_EMAIL)
if (!user) {
  console.error(`No account found for ${TARGET_EMAIL}.`)
  process.exit(1)
}

const { error } = await supabase.auth.admin.updateUserById(user.id, {
  password: NEW_PASSWORD,
  email_confirm: true,
})

if (error) {
  console.error(`Failed to update password for ${TARGET_EMAIL}: ${error.message}`)
  process.exit(1)
}

console.log(`Password updated for ${TARGET_EMAIL}.`)
