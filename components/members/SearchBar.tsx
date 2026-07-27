'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SearchBar() {
  const [search, setSearch] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/members?q=${encodeURIComponent(search)}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-3">
      <div className="relative flex-1">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="input-field pl-12"
        />
      </div>
      <button
        type="submit"
        className="px-5 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium transition-all hover:from-violet-500 hover:to-cyan-500"
      >
        Search
      </button>
    </form>
  )
}
