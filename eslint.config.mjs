import nextVitals from 'eslint-config-next/core-web-vitals'

const ignoredPaths = [
  '.next/**',
  'node_modules/**',
  'out/**',
  'scripts/**',
  'supabase/**',
  'supabase-migrations/**',
  'docs/**',
  '.worktrees/**',
]

const config = [
  { ignores: ignoredPaths },
  ...nextVitals,
  {
    settings: {
      react: {
        version: '19.1.0',
      },
    },
    rules: {
      // The current app has not opted into React Compiler constraints yet.
      // Keep lint focused on the established Next rules until that migration
      // is scoped separately from feature work.
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // eslint-plugin-react's display-name rule still calls the removed
      // context.getFilename API under ESLint 10.
      'react/display-name': 'off',
    },
  },
]

export default config
