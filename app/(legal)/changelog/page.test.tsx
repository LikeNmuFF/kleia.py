import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ChangelogPage from './page'

describe('Changelog page', () => {
  it('shows the latest product updates', () => {
    const html = renderToStaticMarkup(<ChangelogPage />)
    expect(html).toContain('What&#x27;s new in Kleia')
    expect(html).toContain('Private practice labs')
    expect(html).toContain('Recent Solves')
    expect(html).toContain('/privacy')
  })
})
