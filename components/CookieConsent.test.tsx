import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import CookieConsent from './CookieConsent'

describe('CookieConsent', () => {
  it('explains essential cookies and provides consent actions', () => {
    const html = renderToStaticMarkup(<CookieConsent />)
    expect(html).toContain('essential cookies')
    expect(html).toContain('Accept cookies')
    expect(html).toContain('Decline non-essential')
    expect(html).toContain('/privacy')
  })
})
