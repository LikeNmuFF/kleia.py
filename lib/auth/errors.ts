interface AuthErrorLike {
  code?: string
  message?: string
  status?: number
}

export function getAuthErrorMessage(error: unknown): string {
  if (isEmailSendRateLimitError(error)) {
    return 'Too many confirmation emails were requested. Please wait a few minutes, then try signing up again.'
  }

  const authError = toAuthErrorLike(error)
  const message = authError.message?.toLowerCase() ?? ''

  if (message.includes('already registered') || message.includes('already exists')) {
    return 'An account with this email already exists'
  }

  return 'Something went wrong. Please try again.'
}

export function isEmailSendRateLimitError(error: unknown): boolean {
  const authError = toAuthErrorLike(error)
  const message = authError.message?.toLowerCase() ?? ''

  return authError.code === 'over_email_send_rate_limit'
    || (authError.status === 429 && message.includes('email rate limit'))
}

function toAuthErrorLike(error: unknown): AuthErrorLike {
  return (error && typeof error === 'object') ? error as AuthErrorLike : {}
}
