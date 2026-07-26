import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="flex justify-between items-center p-6">
        <span className="text-2xl font-bold text-blue-600">Kleia</span>
        <div className="space-x-4">
          <Link href="/login" className="text-gray-600 hover:text-gray-900">
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign Up
          </Link>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Learn Together,<br />Grow Together
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A community platform for study groups and friends.
            Share resources, track progress, and stay connected.
          </p>
          <Link
            href="/signup"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 inline-block"
          >
            Join the Community
          </Link>
        </div>
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">Posts & Resources</h3>
            <p className="text-gray-600">Share updates, resources, and discuss topics with your community.</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">Real-time Chat</h3>
            <p className="text-gray-600">Message friends directly or in groups with instant delivery.</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Study Tools</h3>
            <p className="text-gray-600">Track progress, share notes, and build playlists together.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
