export interface CcoClubRow {
  id: string
  is_recruiting: boolean
}

export async function ensureCcoClub(supabase: any): Promise<{ club: CcoClubRow | null; error?: string }> {
  const { data: existing, error: lookupError } = await supabase
    .from('clubs')
    .select('id, is_recruiting')
    .eq('slug', 'cco')
    .maybeSingle()

  if (existing) return { club: existing }
  if (lookupError && lookupError.code !== 'PGRST116') {
    return { club: null, error: lookupError.message || 'Could not load CCO setup.' }
  }

  const { data: created, error: createError } = await supabase
    .from('clubs')
    .insert({
      name: 'CCO',
      slug: 'cco',
      description: 'CCO student community sign-up',
      is_recruiting: true,
    })
    .select('id, is_recruiting')
    .single()

  if (createError || !created) {
    return { club: null, error: createError?.message || 'Could not configure CCO sign-up.' }
  }

  return { club: created }
}
