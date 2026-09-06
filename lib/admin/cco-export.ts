export interface CcoRegistrationExportRow {
  id: string
  full_name: string
  email: string
  course: string | null
  year_level: string | null
  set_name: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

interface CcoRegistrationCounts {
  total: number
  pending: number
  approved: number
  rejected: number
}

interface BuildCcoSignupsExportHtmlOptions {
  registrations: CcoRegistrationExportRow[]
  counts: CcoRegistrationCounts
  generatedAt: string
  search?: string
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatSubmittedAt(value: string) {
  return new Date(value).toLocaleString()
}

function safeCount(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
}

export function buildCcoSignupsExportHtml({
  registrations,
  counts,
  generatedAt,
  search = '',
}: BuildCcoSignupsExportHtmlOptions) {
  const rows = registrations.map((row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(row.full_name)}</td>
        <td>${escapeHtml(row.email)}</td>
        <td>${escapeHtml(row.course || '-')}</td>
        <td>${escapeHtml(row.year_level || '-')}</td>
        <td>${escapeHtml(row.set_name)}</td>
        <td>${escapeHtml(formatSubmittedAt(row.created_at))}</td>
      </tr>
    `).join('')

  return `
      <!doctype html>
      <html>
        <head>
          <title>CCO Sign-ups Export</title>
          <style>
            body {
              color: #111827;
              font-family: Arial, sans-serif;
              margin: 32px;
            }

            h1 {
              font-size: 24px;
              margin: 0 0 4px;
            }

            .meta {
              color: #4b5563;
              font-size: 12px;
              margin-bottom: 20px;
            }

            .summary {
              display: grid;
              gap: 8px;
              grid-template-columns: repeat(3, 1fr);
              margin-bottom: 20px;
            }

            .summary div {
              border: 1px solid #d1d5db;
              padding: 10px;
            }

            .summary span {
              color: #6b7280;
              display: block;
              font-size: 11px;
              text-transform: uppercase;
            }

            .summary strong {
              display: block;
              font-size: 20px;
              margin-top: 4px;
            }

            table {
              border-collapse: collapse;
              font-size: 11px;
              width: 100%;
            }

            th,
            td {
              border: 1px solid #d1d5db;
              padding: 7px;
              text-align: left;
              vertical-align: top;
            }

            th {
              background: #f3f4f6;
              font-weight: 700;
            }

            @media print {
              body {
                margin: 18mm;
              }
            }
          </style>
        </head>
        <body>
          <h1>CCO Sign-ups</h1>
          <div class="meta">Generated ${escapeHtml(generatedAt)}${search ? ` - Filter: ${escapeHtml(search)}` : ''}</div>
          <section class="summary">
            <div><span>Total Registered</span><strong>${safeCount(counts.total)}</strong></div>
            <div><span>Showing</span><strong>${safeCount(registrations.length)}</strong></div>
            <div><span>Auto-approved</span><strong>${safeCount(counts.approved)}</strong></div>
          </section>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Email</th>
                <th>Course</th>
                <th>Year</th>
                <th>Set</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="7">No CCO sign-ups found.</td></tr>'}</tbody>
          </table>
        </body>
      </html>
    `
}
