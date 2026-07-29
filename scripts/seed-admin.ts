/**
 * Seed a user as admin.
 * Usage: npx tsx scripts/seed-admin.ts <email>
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Get it from Supabase Dashboard → Project Settings → API → service_role key
 */

import { createClient } from '@supabase/supabase-js'

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: npx tsx scripts/seed-admin.ts <email>')
    process.exit(1)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Find user by email
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', email.replace(/@.*$/, ''))
    .maybeSingle()

  // If not found by username, try finding from auth users
  if (!users) {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
      console.error('Failed to list users:', authError.message)
      process.exit(1)
    }

    const authUser = authUsers.users.find((u: any) => u.email === email)
    if (!authUser) {
      console.error(`No user found with email: ${email}`)
      process.exit(1)
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', authUser.id)

    if (updateError) {
      console.error('Failed to update profile:', updateError.message)
      process.exit(1)
    }

    console.log(`✅ Promoted ${email} (${authUser.id}) to admin`)
  } else {
    // Update by the profile ID we found
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', users.id)

    if (updateError) {
      console.error('Failed to update profile:', updateError.message)
      process.exit(1)
    }

    console.log(`✅ Promoted ${email} (${users.id}) to admin`)
  }

  process.exit(0)
}

main()
