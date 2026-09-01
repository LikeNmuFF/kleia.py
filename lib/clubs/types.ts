export interface Club {
  id: string
  name: string
  slug: string
  description: string | null
  banner_url: string | null
  contact_email: string | null
  is_recruiting: boolean
  creator_id: string | null
  created_at: string
  updated_at: string
}

export interface ClubRegistration {
  id: string
  club_id: string
  full_name: string
  student_id: string | null
  course: string | null
  year_level: string | null
  set_name: string
  email: string
  phone: string | null
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  source: string
  created_at: string
}
