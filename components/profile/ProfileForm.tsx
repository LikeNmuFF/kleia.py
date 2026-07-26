'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  username: string
  full_name: string | null
  bio: string | null
}

interface ProfileFormProps {
  profile: Profile
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async () => {
    setLoading(true)
    await supabase
      .from('profiles')
      .update({ full_name: fullName, bio })
      .eq('id', profile.id)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="bg-[#16213e] rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-[#FFD43B]">Edit Profile</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[#e2e8f0]">Username</label>
          <input
            type="text"
            value={profile.username}
            disabled
            className="w-full border border-[#306998] rounded-lg px-3 py-2 bg-[#1a1a2e] text-[#e2e8f0] opacity-70"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[#e2e8f0]">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-[#306998] rounded-lg px-3 py-2 bg-[#1a1a2e] text-[#e2e8f0] focus:outline-none focus:border-[#FFD43B]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[#e2e8f0]">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full border border-[#306998] rounded-lg px-3 py-2 bg-[#1a1a2e] text-[#e2e8f0] focus:outline-none focus:border-[#FFD43B]"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#306998] text-white px-4 py-2 rounded-lg hover:bg-[#FFD43B] hover:text-[#1a1a2e] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
