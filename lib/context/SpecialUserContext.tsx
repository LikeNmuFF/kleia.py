'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SpecialUserState {
  isSpecial: boolean
  username: string | null
  userId: string | null
  loaded: boolean
}

const SpecialUserContext = createContext<SpecialUserState>({
  isSpecial: false,
  username: null,
  userId: null,
  loaded: false,
})

export function SpecialUserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SpecialUserState>({
    isSpecial: false,
    username: null,
    userId: null,
    loaded: false,
  })

  useEffect(() => {
    const supabase = createClient()

    async function checkSpecial() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setState({ isSpecial: false, username: null, userId: null, loaded: true })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', user.id)
        .single()

      setState({
        isSpecial: profile?.role === 'special',
        username: profile?.username ?? null,
        userId: user.id,
        loaded: true,
      })
    }

    checkSpecial()
  }, [])

  return (
    <SpecialUserContext.Provider value={state}>
      {children}
    </SpecialUserContext.Provider>
  )
}

export function useSpecialUser() {
  return useContext(SpecialUserContext)
}
