-- ============================================
-- KLEIA - Learn: Linux Basics (CTF commands)
-- Seed content only (tables already exist from 023)
-- Run this in Supabase SQL Editor
-- ============================================

-- ===== TOPIC =====

INSERT INTO learn_topics (slug, title, description, icon, sort_order)
VALUES
  ('linux-basics', 'Linux Basics', 'Essential terminal commands for CTF — navigate, search, download, and manage files.', '🐧', 6)
ON CONFLICT (slug) DO NOTHING;

-- ===== LESSONS =====

-- Navigation & Files
INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'navigation', 'Navigation & Files', 1, 15, '[
  {"id": 1, "type": "mcq", "prompt": "Which command lists the files in the current directory?", "options": ["ls", "cd", "cat", "find"], "answer": "ls", "explanation": "ls lists files and folders in the current directory."},
  {"id": 2, "type": "fill", "prompt": "Change into the folder named secret:", "code": "____ secret", "answer": "cd", "explanation": "cd changes the current directory."},
  {"id": 3, "type": "mcq", "prompt": "Which command prints the current directory path?", "options": ["pwd", "ls", "cd", "cat"], "answer": "pwd", "explanation": "pwd prints the working directory, so you know where you are."},
  {"id": 4, "type": "fill", "prompt": "Print the contents of flag.txt:", "code": "____ flag.txt", "answer": "cat", "explanation": "cat prints a file to the terminal — handy for reading flags."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'linux-basics'
ON CONFLICT (topic_id, slug) DO NOTHING;

-- Search & Inspect
INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'searching', 'Search & Inspect', 2, 15, '[
  {"id": 1, "type": "mcq", "prompt": "Which command searches for text inside files?", "options": ["grep", "find", "ls", "cat"], "answer": "grep", "explanation": "grep searches file contents for a pattern — your best friend in CTF."},
  {"id": 2, "type": "fill", "prompt": "Search case-insensitively for the word pass in file.txt:", "code": "grep -____ pass file.txt", "answer": "i", "explanation": "The -i flag makes grep ignore letter case."},
  {"id": 3, "type": "mcq", "prompt": "Which command finds files by name?", "options": ["find", "grep", "ls", "locate"], "answer": "find", "explanation": "find searches the filesystem for files matching a name, e.g. find . -name flag.txt."},
  {"id": 4, "type": "fill", "prompt": "Show only the last 10 lines of a file:", "code": "____ server.log", "answer": "tail", "explanation": "tail prints the end of a file, while head prints the start."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'linux-basics'
ON CONFLICT (topic_id, slug) DO NOTHING;

-- Download & Extract
INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'downloads', 'Download & Extract', 3, 15, '[
  {"id": 1, "type": "fill", "prompt": "Download a file from a URL:", "code": "____ https://example.com/file.zip", "answer": "wget", "explanation": "wget downloads a file from a URL."},
  {"id": 2, "type": "mcq", "prompt": "Which command fetches a URL and can follow redirects with -L?", "options": ["curl", "wget", "grep", "nc"], "answer": "curl", "explanation": "curl transfers data from URLs, and -L follows redirects — common for web challenges."},
  {"id": 3, "type": "fill", "prompt": "Extract a zip archive:", "code": "____ archive.zip", "answer": "unzip", "explanation": "unzip extracts the contents of a zip file."},
  {"id": 4, "type": "mcq", "prompt": "Which command extracts a .tar.gz file?", "options": ["tar -xzf", "tar -czf", "unzip", "gzip -d"], "answer": "tar -xzf", "explanation": "tar -xzf extracts (-x) a gzipped (-z) tarball. -czf creates one instead."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'linux-basics'
ON CONFLICT (topic_id, slug) DO NOTHING;

-- File Ops
INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'file-ops', 'File Operations', 4, 15, '[
  {"id": 1, "type": "fill", "prompt": "Copy source.txt to backup.txt:", "code": "____ source.txt backup.txt", "answer": "cp", "explanation": "cp copies a file."},
  {"id": 2, "type": "mcq", "prompt": "Which command moves or renames a file?", "options": ["mv", "cp", "rm", "touch"], "answer": "mv", "explanation": "mv moves a file — rename with mv old.txt new.txt."},
  {"id": 3, "type": "mcq", "prompt": "Which command permanently deletes a file?", "options": ["rm", "del", "mv", "unlink"], "answer": "rm", "explanation": "rm deletes files. There is no trash — use it carefully."},
  {"id": 4, "type": "fill", "prompt": "Make script.sh executable:", "code": "chmod ____ script.sh", "answer": "+x", "explanation": "chmod +x adds execute permission. The octal form 755 is equivalent."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'linux-basics'
ON CONFLICT (topic_id, slug) DO NOTHING;
