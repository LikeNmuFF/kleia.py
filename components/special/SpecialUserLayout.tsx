'use client'

import { SpecialUserProvider } from '@/lib/context/SpecialUserContext'
import TulipLoginGreeting from '@/components/special/TulipLoginGreeting'
import { useSpecialUser } from '@/lib/context/SpecialUserContext'
import SpecialPageTransition from '@/components/special/SpecialPageTransition'

function SpecialUserEffects() {
  const { isSpecial, loaded } = useSpecialUser()

  if (!loaded) return null

  return (
    <>
      <TulipLoginGreeting isSpecial={isSpecial} />
      {isSpecial && <SpecialPageTransition>{null}</SpecialPageTransition>}
    </>
  )
}

export default function SpecialUserLayout({ children }: { children: React.ReactNode }) {
  return (
    <SpecialUserProvider>
      <SpecialUserEffects />
      {children}
    </SpecialUserProvider>
  )
}
