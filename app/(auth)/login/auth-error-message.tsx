'use client'

import { useEffect, useState } from 'react'

import { getLoginErrorMessage } from '@/lib/auth/errors'

export function AuthErrorMessage({ error }: { error?: string }) {
  const [message, setMessage] = useState(() => getLoginErrorMessage(error))

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const hashErrorCode = hashParams.get('error_code')

    if (hashErrorCode) {
      setMessage(getLoginErrorMessage(hashErrorCode))
    }
  }, [])

  if (!message) return null

  return (
    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
      {message}
    </div>
  )
}
