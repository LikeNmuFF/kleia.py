import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  await requireAdmin(supabase)

  return <AdminDashboard role="admin" />
}
