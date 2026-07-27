import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <span className="text-2xl font-semibold tracking-tight text-white">kleia</span>
        </Link>

        {children}
      </div>
    </div>
  )
}
