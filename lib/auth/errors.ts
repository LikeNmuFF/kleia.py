interface AuthErrorLike {
  code?: string
  message?: string
  status?: number
}

export function getAuthErrorMessage(error: unknown): string {
  const authError = (error && typeof error === 'object') ? error as AuthErrorLike : {}
  const code = authError.code
  const message = authError.message?.toLowerCase() ?? ''
  const status = authError.status

  if (code === 'over_email_send_rate_limit' || (status === 429 && message.includes('email rate limit'))) {
    return 'Too many confirmation emails were requested. Please wait a few minutes, then try signing up again.'
  }

  if (message.includes('already registered') || message.includes('already exists')) {
    return 'An account with this email already exists'
  }

  return 'Something went wrong. Please try again.'
}
