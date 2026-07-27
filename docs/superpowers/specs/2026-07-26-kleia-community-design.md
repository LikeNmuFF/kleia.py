# Kleia Community Platform — Design Spec

## Overview
A learning/study group and social community platform for friends, built with Next.js 14 + Supabase + Cloudinary, deployed on Vercel.

## Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Framer Motion
- **Auth:** Supabase Auth (Email/Password + Google/GitHub OAuth)
- **Database:** Supabase PostgreSQL
- **Real-time:** Supabase Realtime (chat, presence)
- **Storage:** Cloudinary (images/files) + Supabase Storage (metadata)
- **Hosting:** Vercel (free tier)

## Features
1. **Posts/Feed** — share updates, resources, discussions with filters
2. **Chat/Messaging** — real-time DMs and group chat
3. **Events** — schedule study sessions, RSVP system
4. **Members Directory** — browse/search community members
5. **Study Tools** — shared notes, progress tracking, playlists

## Pages
| Route | Page |
|-------|-------|
| `/` | Landing page |
| `/login` | Login (email + OAuth) |
| `/signup` | Sign up |
| `/feed` | Posts feed |
| `/chat` | Chat/Messaging |
| `/events` | Events calendar |
| `/members` | Members directory |
| `/study` | Study tools |
| `/profile` | User profile |

## Database Schema

### Profiles
```sql
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  status text DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'studies')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Posts & Comments
```sql
posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles ON DELETE CASCADE,
  content text NOT NULL,
  type text DEFAULT 'text' CHECK (type IN ('text', 'resource', 'question')),
  tags text[],
  likes_count int DEFAULT 0,
  comments_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts ON DELETE CASCADE,
  author_id uuid REFERENCES profiles ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### Chat
```sql
conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('direct', 'group')),
  name text,
  created_at timestamptz DEFAULT now()
);

conversation_members (
  conversation_id uuid REFERENCES conversations ON DELETE CASCADE,
  user_id uuid REFERENCES profiles ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

### Events
```sql
events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  location text,
  max_attendees int,
  created_at timestamptz DEFAULT now()
);

event_attendees (
  event_id uuid REFERENCES events ON DELETE CASCADE,
  user_id uuid REFERENCES profiles ON DELETE CASCADE,
  status text DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'invited')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
```

### Study Tools
```sql
study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  creator_id uuid REFERENCES profiles ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

shared_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES study_groups ON DELETE CASCADE,
  author_id uuid REFERENCES profiles ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

progress_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE,
  subject text NOT NULL,
  hours_studied decimal DEFAULT 0,
  date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  type text DEFAULT 'link' CHECK (type IN ('youtube', 'spotify', 'link')),
  created_at timestamptz DEFAULT now()
);
```

## Auth Flow
- **Signup:** email + password + username → profile created via database trigger
- **Login:** email/password or OAuth → JWT session via Supabase
- **Protected:** all `/` main routes require auth
- **Middleware:** handles token refresh automatically

## Real-time Chat
- Supabase Realtime subscribes to `messages` table inserts
- Supabase Presence for online status and typing indicators
- Read receipts via `messages.read` column

## File Storage (Cloudinary)
- Upload images/files to Cloudinary
- URL saved to relevant DB table
- Free tier: 25GB storage, 25K transformations/month

## Security

### Row Level Security (RLS)
All tables have RLS enabled. Policies:

**Profiles:**
- Anyone can read profiles (public directory)
- Users can only update their own profile
- Users cannot delete other users' profiles

**Posts:**
- Anyone can read posts (public feed)
- Authenticated users can create posts
- Users can only update/delete their own posts

**Comments:**
- Anyone can read comments
- Authenticated users can create comments
- Users can only update/delete their own comments

**Messages:**
- Users can only read messages in conversations they are members of
- Users can only send messages to conversations they are members of
- Users cannot read/edit other users' messages

**Conversations:**
- Users can only see conversations they are members of
- Users can only create conversations (DMs/groups)

**Events:**
- Anyone can read events (public calendar)
- Authenticated users can create events
- Users can only update/delete their own events
- Users can RSVP to any event

**Study Tools:**
- Shared notes readable by authenticated users
- Users can only edit/delete their own notes
- Progress tracking is private (user sees only their own)
- Users can only edit/delete their own playlists

### Additional Security Measures
- JWT tokens stored in httpOnly cookies (not localStorage)
- CSRF protection via SameSite cookies
- Input validation on all forms (client + server)
- Rate limiting on API routes
- Environment variables for all secrets (never committed)
- HTTPS enforced via Vercel

### Supabase Auth Settings
- Email confirmation enabled (me@kleia.site)
- Password minimum 8 characters
- OAuth providers: Google, GitHub
- JWT expiry: 1 hour (auto-refresh via middleware)

## Free Tier Limits
| Service | Limit |
|---------|-------|
| Supabase DB | 500MB |
| Supabase Auth | 50K MAU |
| Supabase Realtime | 200 connections |
| Cloudinary | 25GB storage |
| Vercel | 100GB bandwidth |

## Deployment
1. Create Supabase project
2. Run SQL migrations
3. Set up Cloudinary account
4. Configure Vercel environment variables
5. Deploy to Vercel
6. Set up custom domain (www.kleia.site)
