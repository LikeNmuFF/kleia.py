'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
}

interface ProfileFormProps {
  profile: Profile
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async () => {
    setLoading(true)
    setSuccess(false)
    await supabase
      .from('profiles')
      .update({ full_name: fullName, bio })
      .eq('id', profile.id)
    setLoading(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <span className="text-white font-bold text-2xl">
                {profile.username[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              {profile.full_name || profile.username}
            </h2>
            <p className="text-gray-400">@{profile.username}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={profile.username}
              disabled
              className="input-field opacity-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              className="input-field resize-none"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>

        {success && (
          <span className="text-emerald-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Changes saved successfully!
          </span>
        )}
      </div>

      {/* Account Info */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Account Info</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-gray-400">Email</span>
            <span className="text-white">{profile.username}@kleia.site</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400">Member Since</span>
            <span className="text-white">July 2026</span>
          </div>
        </div>
      </div>
    </div>
  )
}
