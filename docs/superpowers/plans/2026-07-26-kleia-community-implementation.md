# Kleia Community Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a community platform with posts, chat, events, members directory, and study tools using Next.js 14 + Supabase + Cloudinary.

**Architecture:** Next.js 14 App Router frontend with Supabase for auth, database, realtime, and Cloudinary for file storage. Row Level Security (RLS) protects all data.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Supabase JS, Cloudinary, Vercel

## Global Constraints
- Next.js 14 App Router only
- TypeScript strict mode
- Supabase free tier: 500MB DB, 50K MAU, 1GB storage
- Cloudinary free tier: 25GB storage
- Vercel free tier: 100GB bandwidth
- All tables must have RLS enabled
- JWT tokens in httpOnly cookies only

---

### Task 1: Install Dependencies & Setup Supabase

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`
- Create: `.env.local` (template)
- Modify: `package.json`
- Modify: `middleware.ts`

**Interfaces:**
- Consumes: None (first task)
- Produces: Supabase client utilities for browser and server

- [ ] **Step 1: Install dependencies**

Run: `npm install @supabase/supabase-js @supabase/ssr`

- [ ] **Step 2: Create .env.local template**

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

- [ ] **Step 3: Create browser client**

Create `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4: Create server client**

Create `lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 5: Create middleware helper**

Create `lib/supabase/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

- [ ] **Step 6: Create middleware**

Create `middleware.ts` in root:
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 7: Commit**

```bash
git add lib/supabase/ middleware.ts .env.local
git commit -m "feat: setup Supabase client and auth middleware"
```

---

### Task 2: Create Database Schema

**Files:**
- Create: `docs/superpowers/plans/supabase-schema.sql`
- Create: `docs/superpowers/plans/supabase-rls.sql`
- Create: `docs/superpowers/plans/supabase-triggers.sql`

**Interfaces:**
- Consumes: None
- Produces: SQL files for Supabase setup

- [ ] **Step 1: Create schema SQL**

Create `docs/superpowers/plans/supabase-schema.sql`:
```sql
-- Profiles
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  status text default 'offline' check (status in ('online', 'offline', 'studies')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Posts
create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles on delete cascade not null,
  content text not null,
  type text default 'text' check (type in ('text', 'resource', 'question')),
  tags text[],
  likes_count int default 0,
  comments_count int default 0,
  created_at timestamptz default now()
);

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts on delete cascade not null,
  author_id uuid references profiles on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- Conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct', 'group')),
  name text,
  created_at timestamptz default now()
);

-- Conversation Members
create table conversation_members (
  conversation_id uuid references conversations on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  joined_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

-- Messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations on delete cascade not null,
  sender_id uuid references profiles on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Events
create table events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles on delete cascade not null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  location text,
  max_attendees int,
  created_at timestamptz default now()
);

-- Event Attendees
create table event_attendees (
  event_id uuid references events on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  status text default 'going' check (status in ('going', 'maybe', 'invited')),
  created_at timestamptz default now(),
  primary key (event_id, user_id)
);

-- Study Groups
create table study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  creator_id uuid references profiles on delete cascade not null,
  created_at timestamptz default now()
);

-- Shared Notes
create table shared_notes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references study_groups on delete cascade,
  author_id uuid references profiles on delete cascade not null,
  title text not null,
  content text,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Progress Tracking
create table progress_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade not null,
  subject text not null,
  hours_studied decimal default 0,
  date date default current_date,
  notes text,
  created_at timestamptz default now()
);

-- Playlists
create table playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade not null,
  title text not null,
  url text not null,
  type text default 'link' check (type in ('youtube', 'spotify', 'link')),
  created_at timestamptz default now()
);
```

- [ ] **Step 2: Create RLS SQL**

Create `docs/superpowers/plans/supabase-rls.sql`:
```sql
-- Enable RLS on all tables
alter table profiles enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table conversations enable row level security;
alter table conversation_members enable row level security;
alter table messages enable row level security;
alter table events enable row level security;
alter table event_attendees enable row level security;
alter table study_groups enable row level security;
alter table shared_notes enable row level security;
alter table progress_tracking enable row level security;
alter table playlists enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Posts policies
create policy "Posts are viewable by everyone" on posts for select using (true);
create policy "Authenticated users can create posts" on posts for insert to authenticated with check (true);
create policy "Users can update own posts" on posts for update using (auth.uid() = author_id);
create policy "Users can delete own posts" on posts for delete using (auth.uid() = author_id);

-- Comments policies
create policy "Comments are viewable by everyone" on comments for select using (true);
create policy "Authenticated users can create comments" on comments for insert to authenticated with check (true);
create policy "Users can update own comments" on comments for update using (auth.uid() = author_id);
create policy "Users can delete own comments" on comments for delete using (auth.uid() = author_id);

-- Conversations policies
create policy "Users can view own conversations" on conversations for select using (
  exists (
    select 1 from conversation_members
    where conversation_members.conversation_id = id
    and conversation_members.user_id = auth.uid()
  )
);
create policy "Authenticated users can create conversations" on conversations for insert to authenticated with check (true);

-- Conversation Members policies
create policy "Users can view members of own conversations" on conversation_members for select using (
  exists (
    select 1 from conversation_members cm
    where cm.conversation_id = conversation_members.conversation_id
    and cm.user_id = auth.uid()
  )
);
create policy "Authenticated users can add members" on conversation_members for insert to authenticated with check (true);

-- Messages policies
create policy "Users can view messages in own conversations" on messages for select using (
  exists (
    select 1 from conversation_members
    where conversation_members.conversation_id = messages.conversation_id
    and conversation_members.user_id = auth.uid()
  )
);
create policy "Authenticated users can send messages" on messages for insert to authenticated with check (
  exists (
    select 1 from conversation_members
    where conversation_members.conversation_id = messages.conversation_id
    and conversation_members.user_id = auth.uid()
  )
);

-- Events policies
create policy "Events are viewable by everyone" on events for select using (true);
create policy "Authenticated users can create events" on events for insert to authenticated with check (true);
create policy "Users can update own events" on events for update using (auth.uid() = creator_id);
create policy "Users can delete own events" on events for delete using (auth.uid() = creator_id);

-- Event Attendees policies
create policy "Attendees are viewable by everyone" on event_attendees for select using (true);
create policy "Authenticated users can RSVP" on event_attendees for insert to authenticated with check (true);
create policy "Users can update own RSVP" on event_attendees for update using (auth.uid() = user_id);

-- Study Groups policies
create policy "Study groups are viewable by everyone" on study_groups for select using (true);
create policy "Authenticated users can create groups" on study_groups for insert to authenticated with check (true);
create policy "Users can update own groups" on study_groups for update using (auth.uid() = creator_id);

-- Shared Notes policies
create policy "Notes are viewable by authenticated users" on shared_notes for select to authenticated using (true);
create policy "Authenticated users can create notes" on shared_notes for insert to authenticated with check (true);
create policy "Users can update own notes" on shared_notes for update using (auth.uid() = author_id);
create policy "Users can delete own notes" on shared_notes for delete using (auth.uid() = author_id);

-- Progress Tracking policies (private)
create policy "Users can view own progress" on progress_tracking for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on progress_tracking for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own progress" on progress_tracking for update using (auth.uid() = user_id);
create policy "Users can delete own progress" on progress_tracking for delete using (auth.uid() = user_id);

-- Playlists policies
create policy "Playlists are viewable by authenticated users" on playlists for select to authenticated using (true);
create policy "Authenticated users can create playlists" on playlists for insert to authenticated with check (true);
create policy "Users can update own playlists" on playlists for update using (auth.uid() = user_id);
create policy "Users can delete own playlists" on playlists for delete using (auth.uid() = user_id);
```

- [ ] **Step 3: Create triggers SQL**

Create `docs/superpowers/plans/supabase-triggers.sql`:
```sql
-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on profiles
  for each row execute function update_updated_at_column();

create trigger update_shared_notes_updated_at before update on shared_notes
  for each row execute function update_updated_at_column();

-- Enable realtime for messages
alter publication supabase_realtime add table messages;
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/supabase-*.sql
git commit -m "feat: add Supabase schema, RLS, and triggers"
```

---

### Task 3: Auth Pages (Login & Signup)

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`
- Create: `app/(auth)/layout.tsx`
- Create: `components/auth/AuthForm.tsx`

**Interfaces:**
- Consumes: Supabase client from Task 1
- Produces: Working login/signup pages

- [ ] **Step 1: Create auth layout**

Create `app/(auth)/layout.tsx`:
```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create signup page**

Create `app/(auth)/signup/page.tsx`:
```tsx
import { signup } from './actions'

export default function SignupPage() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-bold mb-6">Sign Up</h1>
      <form className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            name="username"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <button
          type="submit"
          formAction={signup}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Sign Up
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Create signup action**

Create `app/(auth)/signup/actions.ts`:
```tsx
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        username: formData.get('username') as string,
      },
    },
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/signup?error=' + error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/feed')
}
```

- [ ] **Step 4: Create login page**

Create `app/(auth)/login/page.tsx`:
```tsx
import { login, signInWithGoogle, signInWithGitHub } from './actions'

export default function LoginPage() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <form className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <button
          type="submit"
          formAction={login}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Login
        </button>
      </form>
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="w-full border rounded-lg py-2 hover:bg-gray-50"
            >
              Google
            </button>
          </form>
          <form action={signInWithGitHub}>
            <button
              type="submit"
              className="w-full border rounded-lg py-2 hover:bg-gray-50"
            >
              GitHub
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create login actions**

Create `app/(auth)/login/actions.ts`:
```tsx
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=' + error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/feed')
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) throw error
  redirect(data.url)
}

export async function signInWithGitHub() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) throw error
  redirect(data.url)
}
```

- [ ] **Step 6: Create auth callback route**

Create `app/auth/callback/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/feed'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
```

- [ ] **Step 7: Commit**

```bash
git add app/(auth)/ app/auth/
git commit -m "feat: add login and signup pages with OAuth"
```

---

### Task 4: Landing Page

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: None
- Produces: Landing page with hero, features, CTA

- [ ] **Step 1: Create landing page**

Replace `app/page.tsx`:
```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add landing page"
```

---

### Task 5: Feed Page & Posts

**Files:**
- Create: `app/(main)/feed/page.tsx`
- Create: `components/feed/PostCard.tsx`
- Create: `components/feed/CreatePost.tsx`

**Interfaces:**
- Consumes: Supabase client, profiles, posts tables
- Produces: Feed page with posts list and create post form

- [ ] **Step 1: Create PostCard component**

Create `components/feed/PostCard.tsx`:
```tsx
import { createClient } from '@/lib/supabase/client'

interface PostCardProps {
  post: {
    id: string
    content: string
    type: string
    created_at: string
    profiles: { username: string; avatar_url: string | null }
  }
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          {post.profiles.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              alt=""
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <span className="text-blue-600 font-semibold">
              {post.profiles.username[0].toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold">{post.profiles.username}</p>
          <p className="text-sm text-gray-500">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <p className="whitespace-pre-wrap">{post.content}</p>
    </div>
  )
}
```

- [ ] **Step 2: Create CreatePost component**

Create `components/feed/CreatePost.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CreatePost() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('posts').insert({
        author_id: user.id,
        content: content.trim(),
        type: 'text',
      })
      setContent('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share something with the community..."
        className="w-full border rounded-lg p-3 resize-none"
        rows={3}
      />
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Create feed page**

Create `app/(main)/feed/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/feed/PostCard'
import CreatePost from '@/components/feed/CreatePost'

export default async function FeedPage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles(username, avatar_url)')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Feed</h1>
      <CreatePost />
      <div className="mt-6 space-y-4">
        {posts?.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create main layout**

Create `app/(main)/layout.tsx`:
```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/auth/LogoutButton'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/feed" className="text-xl font-bold text-blue-600">
            Kleia
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/feed" className="text-gray-600 hover:text-gray-900">Feed</Link>
            <Link href="/chat" className="text-gray-600 hover:text-gray-900">Chat</Link>
            <Link href="/events" className="text-gray-600 hover:text-gray-900">Events</Link>
            <Link href="/members" className="text-gray-600 hover:text-gray-900">Members</Link>
            <Link href="/study" className="text-gray-600 hover:text-gray-900">Study</Link>
            <Link href="/profile" className="text-gray-600 hover:text-gray-900">
              {user?.email}
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
```

- [ ] **Step 5: Create LogoutButton component**

Create `components/auth/LogoutButton.tsx`:
```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="text-gray-600 hover:text-gray-900"
    >
      Logout
    </button>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add app/(main)/ components/feed/ components/auth/LogoutButton.tsx
git commit -m "feat: add feed page with posts"
```

---

### Task 6: Chat System

**Files:**
- Create: `app/(main)/chat/page.tsx`
- Create: `components/chat/ChatSidebar.tsx`
- Create: `components/chat/ChatWindow.tsx`
- Create: `components/chat/MessageInput.tsx`

**Interfaces:**
- Consumes: Supabase client, conversations, messages tables
- Produces: Working real-time chat

- [ ] **Step 1: Create MessageInput component**

Create `components/chat/MessageInput.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MessageInputProps {
  conversationId: string
}

export default function MessageInput({ conversationId }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: message.trim(),
      })
      setMessage('')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSend} className="border-t p-4">
      <div className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-lg px-4 py-2"
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create ChatWindow component**

Create `components/chat/ChatWindow.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import MessageInput from './MessageInput'

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  profiles: { username: string }
}

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
}

export default function ChatWindow({ conversationId, currentUserId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(username)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)
    }

    fetchMessages()

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.sender_id === currentUserId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm font-medium mb-1">{msg.profiles.username}</p>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
      </div>
      <MessageInput conversationId={conversationId} />
    </div>
  )
}
```

- [ ] **Step 3: Create ChatSidebar component**

Create `components/chat/ChatSidebar.tsx`:
```tsx
'use client'

interface Conversation {
  id: string
  name: string | null
  type: string
}

interface ChatSidebarProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function ChatSidebar({ conversations, selectedId, onSelect }: ChatSidebarProps) {
  return (
    <div className="w-64 border-r bg-gray-50 h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Messages</h2>
      </div>
      <div className="overflow-y-auto">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full text-left p-4 border-b hover:bg-gray-100 ${
              selectedId === conv.id ? 'bg-blue-50' : ''
            }`}
          >
            <p className="font-medium">{conv.name || 'Direct Message'}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create chat page**

Create `app/(main)/chat/page.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatWindow from '@/components/chat/ChatWindow'

interface Conversation {
  id: string
  name: string | null
  type: string
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data } = await supabase
          .from('conversation_members')
          .select('conversations(id, name, type)')
          .eq('user_id', user.id)

        if (data) {
          setConversations(data.map((d) => d.conversations as unknown as Conversation))
        }
      }
    }

    fetchData()
  }, [])

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <ChatSidebar
        conversations={conversations}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <div className="flex-1">
        {selectedId && userId ? (
          <ChatWindow conversationId={selectedId} currentUserId={userId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/(main)/chat/ components/chat/
git commit -m "feat: add real-time chat system"
```

---

### Task 7: Events Page

**Files:**
- Create: `app/(main)/events/page.tsx`
- Create: `components/events/EventCard.tsx`
- Create: `components/events/CreateEvent.tsx`

**Interfaces:**
- Consumes: Supabase client, events, event_attendees tables
- Produces: Events page with calendar view and RSVP

- [ ] **Step 1: Create EventCard component**

Create `components/events/EventCard.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface EventCardProps {
  event: {
    id: string
    title: string
    description: string | null
    start_time: string
    location: string | null
    profiles: { username: string }
  }
  currentUserId: string
}

export default function EventCard({ event, currentUserId }: EventCardProps) {
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null)
  const supabase = createClient()

  const handleRSVP = async (status: string) => {
    await supabase.from('event_attendees').upsert({
      event_id: event.id,
      user_id: currentUserId,
      status,
    })
    setRsvpStatus(status)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
      {event.description && (
        <p className="text-gray-600 mb-2">{event.description}</p>
      )}
      <p className="text-sm text-gray-500 mb-1">
        📅 {new Date(event.start_time).toLocaleDateString()}
      </p>
      {event.location && (
        <p className="text-sm text-gray-500 mb-4">📍 {event.location}</p>
      )}
      <div className="flex space-x-2">
        <button
          onClick={() => handleRSVP('going')}
          className={`px-3 py-1 rounded ${
            rsvpStatus === 'going'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Going
        </button>
        <button
          onClick={() => handleRSVP('maybe')}
          className={`px-3 py-1 rounded ${
            rsvpStatus === 'maybe'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Maybe
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create CreateEvent component**

Create `components/events/CreateEvent.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CreateEvent() {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('events').insert({
        creator_id: user.id,
        title,
        description,
        start_time: startTime,
        location,
      })
      setTitle('')
      setDescription('')
      setStartTime('')
      setLocation('')
      setIsOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Create Event
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Event</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: Create events page**

Create `app/(main)/events/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import EventCard from '@/components/events/EventCard'
import CreateEvent from '@/components/events/CreateEvent'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select('*, profiles(username)')
    .order('start_time', { ascending: true })

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <CreateEvent />
      </div>
      <div className="space-y-4">
        {events?.map((event) => (
          <EventCard key={event.id} event={event} currentUserId={user?.id || ''} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/(main)/events/ components/events/
git commit -m "feat: add events page with RSVP"
```

---

### Task 8: Members Directory

**Files:**
- Create: `app/(main)/members/page.tsx`
- Create: `components/members/MemberCard.tsx`

**Interfaces:**
- Consumes: Supabase client, profiles table
- Produces: Members directory with search

- [ ] **Step 1: Create MemberCard component**

Create `components/members/MemberCard.tsx`:
```tsx
interface Member {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  status: string
}

export default function MemberCard({ member }: { member: Member }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt=""
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <span className="text-blue-600 font-semibold text-lg">
              {member.username[0].toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold">{member.full_name || member.username}</p>
          <p className="text-sm text-gray-500">@{member.username}</p>
        </div>
      </div>
      {member.bio && <p className="mt-3 text-gray-600">{member.bio}</p>}
      <div className="mt-3">
        <span
          className={`text-xs px-2 py-1 rounded ${
            member.status === 'online'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {member.status}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create members page**

Create `app/(main)/members/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import MemberCard from '@/components/members/MemberCard'
import SearchBar from '@/components/members/SearchBar'

export default async function MembersPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .order('username')

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Members</h1>
      <SearchBar />
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {members?.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create SearchBar component**

Create `components/members/SearchBar.tsx`:
```tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
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
    <form onSubmit={handleSearch} className="flex space-x-2">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search members..."
        className="flex-1 border rounded-lg px-4 py-2"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Search
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/(main)/members/ components/members/
git commit -m "feat: add members directory with search"
```

---

### Task 9: Study Tools

**Files:**
- Create: `app/(main)/study/page.tsx`
- Create: `components/study/NotesEditor.tsx`
- Create: `components/study/ProgressTracker.tsx`
- Create: `components/study/PlaylistManager.tsx`

**Interfaces:**
- Consumes: Supabase client, shared_notes, progress_tracking, playlists tables
- Produces: Study tools page with notes, progress, playlists

- [ ] **Step 1: Create NotesEditor component**

Create `components/study/NotesEditor.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Note {
  id: string
  title: string
  content: string | null
  tags: string[] | null
}

interface NotesEditorProps {
  notes: Note[]
}

export default function NotesEditor({ notes }: NotesEditorProps) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      if (selectedNote) {
        await supabase
          .from('shared_notes')
          .update({ title, content })
          .eq('id', selectedNote.id)
      } else {
        await supabase.from('shared_notes').insert({
          author_id: user.id,
          title,
          content,
        })
      }
      setTitle('')
      setContent('')
      setSelectedNote(null)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Shared Notes</h2>
      <div className="space-y-2 mb-4">
        {notes.map((note) => (
          <button
            key={note.id}
            onClick={() => {
              setSelectedNote(note)
              setTitle(note.title)
              setContent(note.content || '')
            }}
            className="w-full text-left p-2 rounded hover:bg-gray-100"
          >
            {note.title}
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="Note title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 mb-2"
      />
      <textarea
        placeholder="Write your note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        className="w-full border rounded-lg px-3 py-2 mb-2"
      />
      <button
        onClick={handleSave}
        disabled={loading || !title.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Note'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create ProgressTracker component**

Create `components/study/ProgressTracker.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Progress {
  id: string
  subject: string
  hours_studied: number
  date: string
}

interface ProgressTrackerProps {
  progress: Progress[]
}

export default function ProgressTracker({ progress }: ProgressTrackerProps) {
  const [subject, setSubject] = useState('')
  const [hours, setHours] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAdd = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user && subject && hours) {
      await supabase.from('progress_tracking').insert({
        user_id: user.id,
        subject,
        hours_studied: parseFloat(hours),
      })
      setSubject('')
      setHours('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Progress Tracking</h2>
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <input
          type="number"
          placeholder="Hours"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="w-24 border rounded-lg px-3 py-2"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !subject || !hours}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <div className="space-y-2">
        {progress.map((p) => (
          <div key={p.id} className="flex justify-between p-2 bg-gray-50 rounded">
            <span>{p.subject}</span>
            <span className="text-gray-600">{p.hours_studied}h</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create PlaylistManager component**

Create `components/study/PlaylistManager.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Playlist {
  id: string
  title: string
  url: string
  type: string
}

interface PlaylistManagerProps {
  playlists: Playlist[]
}

export default function PlaylistManager({ playlists }: PlaylistManagerProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAdd = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user && title && url) {
      await supabase.from('playlists').insert({
        user_id: user.id,
        title,
        url,
        type: 'link',
      })
      setTitle('')
      setUrl('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Playlists</h2>
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <input
          type="url"
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !title || !url}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <div className="space-y-2">
        {playlists.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-2 bg-gray-50 rounded hover:bg-gray-100"
          >
            {p.title}
          </a>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create study page**

Create `app/(main)/study/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import NotesEditor from '@/components/study/NotesEditor'
import ProgressTracker from '@/components/study/ProgressTracker'
import PlaylistManager from '@/components/study/PlaylistManager'

export default async function StudyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: notes } = await supabase
    .from('shared_notes')
    .select('*')
    .order('updated_at', { ascending: false })

  const { data: progress } = await supabase
    .from('progress_tracking')
    .select('*')
    .eq('user_id', user?.id || '')
    .order('date', { ascending: false })

  const { data: playlists } = await supabase
    .from('playlists')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Study Tools</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <NotesEditor notes={notes || []} />
        <ProgressTracker progress={progress || []} />
      </div>
      <div className="mt-6">
        <PlaylistManager playlists={playlists || []} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/(main)/study/ components/study/
git commit -m "feat: add study tools (notes, progress, playlists)"
```

---

### Task 10: Profile Page

**Files:**
- Create: `app/(main)/profile/page.tsx`
- Create: `components/profile/ProfileForm.tsx`

**Interfaces:**
- Consumes: Supabase client, profiles table
- Produces: Profile page with edit functionality

- [ ] **Step 1: Create ProfileForm component**

Create `components/profile/ProfileForm.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  username: string
  full_name: string | null
  bio: string | null
}

interface ProfileFormProps {
  profile: Profile
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async () => {
    setLoading(true)
    await supabase
      .from('profiles')
      .update({ full_name: fullName, bio })
      .eq('id', profile.id)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            value={profile.username}
            disabled
            className="w-full border rounded-lg px-3 py-2 bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create profile page**

Create `app/(main)/profile/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/profile/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id || '')
    .single()

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      {profile && <ProfileForm profile={profile} />}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(main)/profile/ components/profile/
git commit -m "feat: add profile page with edit"
```

---

### Task 11: Environment Variables & Deployment

**Files:**
- Create: `.env.example`
- Modify: `next.config.js` (if needed)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Ready for deployment

- [ ] **Step 1: Create .env.example**

Create `.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

- [ ] **Step 2: Update .env.local with real values**

Fill in actual values from Supabase dashboard:
1. Go to Supabase → Settings → API
2. Copy Project URL and Anon Key
3. Update `.env.local`

- [ ] **Step 3: Set up Cloudinary**

1. Create Cloudinary account
2. Get cloud name from dashboard
3. Add to `.env.local`

- [ ] **Step 4: Commit**

```bash
git add .env.example
git commit -m "chore: add env example file"
```

---

### Task 12: Final Testing & Deploy

**Files:**
- None (testing and deployment steps)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Deployed application

- [ ] **Step 1: Test locally**

Run: `npm run dev`
Test all pages:
- Landing page loads
- Signup works
- Login works
- Feed displays
- Chat works
- Events display
- Members display
- Study tools work
- Profile edits save

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Fix any errors

- [ ] **Step 3: Build for production**

Run: `npm run build`
Ensure no errors

- [ ] **Step 4: Deploy to Vercel**

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

- [ ] **Step 5: Configure custom domain**

1. Go to Vercel → Settings → Domains
2. Add www.kleia.site
3. Configure DNS records

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: Kleia community platform v1.0"
git push origin main
```
