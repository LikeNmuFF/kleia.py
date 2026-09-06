import { describe, expect, it } from 'vitest'
import { buildCcoSignupsExportHtml } from '../../lib/admin/cco-export'

describe('buildCcoSignupsExportHtml', () => {
  it('escapes exported registration data without emitting executable script tags', () => {
    const html = buildCcoSignupsExportHtml({
      counts: { total: 1, pending: 0, approved: 1, rejected: 0 },
      generatedAt: '</script><script>alert("generated")</script>',
      registrations: [
        {
          id: 'reg-1',
          full_name: '</script><script>alert("name")</script>',
          email: 'student@example.test',
          course: '<img src=x onerror=alert(1)>',
          year_level: '1st',
          set_name: 'A',
          status: 'approved',
          created_at: '2026-09-06T01:00:00.000Z',
        },
      ],
      search: '</script><script>alert("filter")</script>',
    })

    expect(html).not.toContain('<script')
    expect(html).not.toContain('</script>')
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
    expect(html).toContain('&lt;/script&gt;&lt;script&gt;alert(&quot;name&quot;)&lt;/script&gt;')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })
})
