'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Check, Loader2, Lock, User } from 'lucide-react'
import { updateProfile, checkUsernameAvailability, updatePassword } from '@/app/actions/profile'

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

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile.full_name || '')
  const [username, setUsername] = useState(profile.username)
  const [bio, setBio] = useState(profile.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || '')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 1 * 1024 * 1024) {
      setError('Image must be under 1MB')
      return
    }

    setAvatarFile(file)
    setError('')

    const reader = new FileReader()
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'kleia-avatars')
    formData.append('folder', 'kleia/avatars')

    try {
      const res = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      return data.secure_url
    } catch {
      return null
    }
  }

  const handleUsernameChange = async (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    setUsername(cleaned)

    if (cleaned.length < 3) {
      setUsernameStatus('idle')
      return
    }

    if (cleaned === profile.username) {
      setUsernameStatus('idle')
      return
    }

    setUsernameStatus('checking')
    const { available } = await checkUsernameAvailability(cleaned, profile.id)
    setUsernameStatus(available ? 'available' : 'taken')
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)

    let newAvatarUrl = avatarUrl

    if (avatarFile) {
      setUploading(true)
      const uploadedUrl = await uploadToCloudinary(avatarFile)
      setUploading(false)

      if (!uploadedUrl) {
        setError('Failed to upload avatar. Please try again.')
        setLoading(false)
        return
      }
      newAvatarUrl = uploadedUrl
    }

    if (username !== profile.username) {
      if (usernameStatus === 'taken') {
        setError('Username is already taken')
        setLoading(false)
        return
      }
      if (usernameStatus === 'checking') {
        setError('Please wait for username check to complete')
        setLoading(false)
        return
      }
    }

    const result = await updateProfile({
      user_id: profile.id,
      username: username !== profile.username ? username : undefined,
      full_name: displayName,
      bio,
      avatar_url: newAvatarUrl !== avatarUrl ? newAvatarUrl : undefined,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setAvatarUrl(newAvatarUrl)
    setAvatarFile(null)
    setLoading(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Profile Picture</h3>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt=""
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </div>
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Change avatar</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>JPG, PNG or GIF. Max 1MB.</p>
            {uploading && (
              <p className="text-sm text-violet-400 flex items-center gap-1 mt-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Display Name & Username */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Public Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What should we call you?"
              className="input-field"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>This is the name others see on your profile</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className="input-field pl-8"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === 'checking' && (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--text-muted)' }} />
                )}
                {usernameStatus === 'available' && (
                  <Check className="w-4 h-4 text-emerald-400" />
                )}
                {usernameStatus === 'taken' && (
                  <span className="text-xs text-red-400">Taken</span>
                )}
              </div>
            </div>
            {usernameStatus === 'taken' && (
              <p className="text-xs text-red-400 mt-1">This username is already taken</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
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

      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={loading || uploading}
          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>

        {success && (
          <span className="text-emerald-400 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            Changes saved successfully!
          </span>
        )}
      </div>

      {/* Account Info */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Account Info</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Email</span>
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Connected via OAuth</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span style={{ color: 'var(--text-secondary)' }}>Member Since</span>
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          <Lock className="w-4 h-4 inline mr-2" />
          Change Password
        </h3>
        <form action={async (formData) => {
          const current = formData.get('currentPassword') as string
          const newPass = formData.get('newPassword') as string
          const confirm = formData.get('confirmPassword') as string

          if (newPass !== confirm) {
            setPasswordError('Passwords do not match')
            return
          }

          setPasswordLoading(true)
          setPasswordError('')
          setPasswordSuccess(false)

          const result = await updatePassword(current, newPass)
          setPasswordLoading(false)

          if (result.error) {
            setPasswordError(result.error)
          } else {
            setPasswordSuccess(true)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setTimeout(() => setPasswordSuccess(false), 3000)
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Current Password
            </label>
            <input
              name="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              New Password
            </label>
            <input
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Confirm New Password
            </label>
            <input
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="input-field"
            />
          </div>

          {passwordError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              Password updated successfully
            </div>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50"
          >
            {passwordLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </span>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
