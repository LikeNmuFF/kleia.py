-- ============================================
-- KLEIA - Learn: Python learning game
-- Tables, RLS, and seed content
-- Run this in Supabase SQL Editor
-- ============================================

-- ===== TABLES =====

CREATE TABLE IF NOT EXISTS learn_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🐍',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learn_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES learn_topics(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  xp_reward int NOT NULL DEFAULT 10 CHECK (xp_reward > 0),
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (topic_id, slug)
);

CREATE TABLE IF NOT EXISTS learn_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES learn_lessons(id) ON DELETE CASCADE,
  xp_earned int NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

-- ===== RLS =====

ALTER TABLE learn_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE learn_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE learn_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view learn topics" ON learn_topics;
DROP POLICY IF EXISTS "Anyone can view learn lessons" ON learn_lessons;
DROP POLICY IF EXISTS "Users can view own learn progress" ON learn_progress;
DROP POLICY IF EXISTS "Users can insert own learn progress" ON learn_progress;
DROP POLICY IF EXISTS "Users can update own learn progress" ON learn_progress;

CREATE POLICY "Anyone can view learn topics"
  ON learn_topics FOR SELECT USING (true);

CREATE POLICY "Anyone can view learn lessons"
  ON learn_lessons FOR SELECT USING (true);

CREATE POLICY "Users can view own learn progress"
  ON learn_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learn progress"
  ON learn_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learn progress"
  ON learn_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ===== INDEXES =====

CREATE INDEX IF NOT EXISTS learn_lessons_topic_order_idx
  ON learn_lessons (topic_id, sort_order);

CREATE INDEX IF NOT EXISTS learn_progress_user_idx
  ON learn_progress (user_id);

-- ===== SEED: TOPICS =====

INSERT INTO learn_topics (slug, title, description, icon, sort_order)
VALUES
  ('python-basics', 'Python Basics', 'Variables, data types, strings, and printing — the building blocks of Python.', '🐍', 1),
  ('control-flow', 'Control Flow', 'Make decisions with if/else and repeat work with loops.', '🔀', 2),
  ('data-structures', 'Data Structures', 'Lists, tuples, dictionaries, and sets to organize your data.', '📦', 3),
  ('functions', 'Functions', 'Write reusable code with def, parameters, and return values.', '🧩', 4),
  ('modules-errors', 'Modules & Errors', 'Import modules, handle errors with try/except, and use common built-ins.', '🛠️', 5)
ON CONFLICT (slug) DO NOTHING;

-- ===== SEED: LESSONS =====

INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'hello-world', 'Hello, World!', 1, 10, '[
  {"id": 1, "type": "mcq", "prompt": "Which function prints text to the console in Python?", "options": ["print()", "echo()", "console.log()", "display()"], "answer": "print()", "explanation": "print() writes its arguments to the standard output."},
  {"id": 2, "type": "fill", "prompt": "Complete the code to print the message:  ____(\"Hello, World!\")", "code": "____(\"Hello, World!\")", "answer": "print", "explanation": "The function is print()."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'python-basics'
ON CONFLICT (topic_id, slug) DO NOTHING;

INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'variables', 'Variables & Data Types', 2, 15, '[
  {"id": 1, "type": "mcq", "prompt": "What type is the value stored by  age = 25 ?", "options": ["int", "float", "str", "bool"], "answer": "int", "explanation": "25 has no decimal point, so it is an integer (int)."},
  {"id": 2, "type": "fill", "prompt": "Create a variable named score that stores the number 100:", "code": "score = ____", "answer": "100", "explanation": "Assign values with the = operator."},
  {"id": 3, "type": "mcq", "prompt": "Which of these is a valid variable name?", "options": ["2cats", "my_var", "my-var", "my var"], "answer": "my_var", "explanation": "Variable names can use underscores but cannot start with a digit or contain spaces or hyphens."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'python-basics'
ON CONFLICT (topic_id, slug) DO NOTHING;

INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'strings', 'Working with Strings', 3, 15, '[
  {"id": 1, "type": "mcq", "prompt": "What does  len(\"hello\")  return?", "options": ["4", "5", "6", "hello"], "answer": "5", "explanation": "len() returns the number of characters — \"hello\" has 5."},
  {"id": 2, "type": "fill", "prompt": "Combine two strings:  greeting = \"Hi \" + ____", "code": "greeting = \"Hi \" + ____", "answer": "there", "explanation": "The + operator concatenates strings; you need a string value like \"there\"."},
  {"id": 3, "type": "mcq", "prompt": "What is the result of  \"a\" * 3 ?", "options": ["aaa", "a a a", "3a", "Error"], "answer": "aaa", "explanation": "Multiplying a string by an integer repeats it: \"a\" * 3 is \"aaa\"."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'python-basics'
ON CONFLICT (topic_id, slug) DO NOTHING;

INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'input', 'Getting User Input', 4, 15, '[
  {"id": 1, "type": "mcq", "prompt": "Which function reads text typed by the user?", "options": ["input()", "read()", "scan()", "get()"], "answer": "input()", "explanation": "input() reads a line from the user and returns it as a string."},
  {"id": 2, "type": "fill", "prompt": "Store the user reply:  name = ____(\"What is your name? \")", "code": "name = ____(\"What is your name? \")", "answer": "input", "explanation": "input() reads the user reply into the variable name."},
  {"id": 3, "type": "mcq", "prompt": "What type does input() always return?", "options": ["str", "int", "float", "list"], "answer": "str", "explanation": "input() always returns a string, even if the user types numbers. Use int() to convert."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'python-basics'
ON CONFLICT (topic_id, slug) DO NOTHING;

-- Control Flow
INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'if-else', 'If / Else', 1, 15, '[
  {"id": 1, "type": "fill", "prompt": "Complete the condition that runs when a person is an adult:", "code": "if ____ >= 18:\n    print(\"Adult\")", "answer": "age", "explanation": "The variable age holds the age of the person, and the condition checks it against 18."},
  {"id": 2, "type": "mcq", "prompt": "Which keyword starts the opposite branch of an if?", "options": ["else", "then", "except", "otherwise"], "answer": "else", "explanation": "else runs when the if condition is False."},
  {"id": 3, "type": "mcq", "prompt": "What prints?  x = 5; if x > 3: print(\"big\") else: print(\"small\")", "options": ["big", "small", "both", "nothing"], "answer": "big", "explanation": "5 > 3 is True, so the if branch runs and prints big."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'control-flow'
ON CONFLICT (topic_id, slug) DO NOTHING;

INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'for-loops', 'For Loops', 2, 15, '[
  {"id": 1, "type": "mcq", "prompt": "How many times does this loop run?  for i in range(3):", "options": ["3", "2", "4", "1"], "answer": "3", "explanation": "range(3) yields 0, 1, 2 — three iterations."},
  {"id": 2, "type": "fill", "prompt": "Loop over each item:  for fruit in fruits:  ____(fruit)", "code": "for fruit in fruits:\n    ____(fruit)", "answer": "print", "explanation": "Inside the loop body we print each fruit."},
  {"id": 3, "type": "mcq", "prompt": "What is the total?  total = 0; for i in range(1, 4): total += i", "options": ["6", "3", "10", "0"], "answer": "6", "explanation": "1 + 2 + 3 = 6. range(1, 4) gives 1, 2, 3."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'control-flow'
ON CONFLICT (topic_id, slug) DO NOTHING;

INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'while-loops', 'While Loops', 3, 15, '[
  {"id": 1, "type": "mcq", "prompt": "When does a while loop stop?", "options": ["When its condition becomes False", "After 10 runs", "Never", "When it reaches a for"], "answer": "When its condition becomes False", "explanation": "while repeats as long as its condition is True and stops when it becomes False."},
  {"id": 2, "type": "fill", "prompt": "Count down:  while count > ____:", "code": "while count > ____:", "answer": "0", "explanation": "The loop continues while count is greater than 0."},
  {"id": 3, "type": "mcq", "prompt": "What is dangerous about  while True:  with no break?", "options": ["Infinite loop", "Syntax error", "Nothing", "It only runs once"], "answer": "Infinite loop", "explanation": "while True with no break runs forever — be careful!"}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'control-flow'
ON CONFLICT (topic_id, slug) DO NOTHING;

INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'break-continue', 'Break & Continue', 4, 10, '[
  {"id": 1, "type": "mcq", "prompt": "What does  break  do inside a loop?", "options": ["Exits the loop immediately", "Skips to the next iteration", "Restarts the loop", "Prints an error"], "answer": "Exits the loop immediately", "explanation": "break stops the loop entirely."},
  {"id": 2, "type": "mcq", "prompt": "What does  continue  do?", "options": ["Skips the rest of this iteration", "Exits the loop", "Adds 1", "Breaks the program"], "answer": "Skips the rest of this iteration", "explanation": "continue jumps to the next iteration, skipping the remaining code in the body."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'control-flow'
ON CONFLICT (topic_id, slug) DO NOTHING;

-- Data Structures
INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'lists', 'Lists', 1, 15, '[
  {"id": 1, "type": "mcq", "prompt": "Which creates an empty list?", "options": ["items = []", "items = {}", "items = ()", "items = <>"], "answer": "items = []", "explanation": "Square brackets create a list."},
  {"id": 2, "type": "mcq", "prompt": "What is the index of the first item in a list?", "options": ["0", "1", "-1", "None"], "answer": "0", "explanation": "Python is zero-indexed — the first item is at index 0."},
  {"id": 3, "type": "fill", "prompt": "Add an item to the end:  colors.____(\"blue\")", "code": "colors.____(\"blue\")", "answer": "append", "explanation": "list.append(x) adds x to the end of the list."},
  {"id": 4, "type": "mcq", "prompt": "What is  len([10, 20, 30]) ?", "options": ["3", "2", "4", "10"], "answer": "3", "explanation": "len() counts the number of items: three."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'data-structures'
ON CONFLICT (topic_id, slug) DO NOTHING;

INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'tuples', 'Tuples', 2, 10, '[
  {"id": 1, "type": "mcq", "prompt": "Which creates a tuple?", "options": ["point = (1, 2)", "point = [1, 2]", "point = {1, 2}", "point = 1..2"], "answer": "point = (1, 2)", "explanation": "Parentheses create a tuple."},
  {"id": 2, "type": "mcq", "prompt": "Can you change an item in a tuple after creating it?", "options": ["No, tuples are immutable", "Yes, always", "Only once", "Only in Python 3"], "answer": "No, tuples are immutable", "explanation": "Tuples cannot be modified after creation — that is their key difference from lists."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'data-structures'
ON CONFLICT (topic_id, slug) DO NOTHING;

INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'dictionaries', 'Dictionaries', 3, 15, '[
  {"id": 1, "type": "mcq", "prompt": "Which creates an empty dictionary?", "options": ["person = {}", "person = []", "person = ()", "person = None"], "answer": "person = {}", "explanation": "Curly braces create a dictionary."},
  {"id": 2, "type": "fill", "prompt": "Get the value for a key:  name = person.____(\"name\")", "code": "name = person.____(\"name\")", "answer": "get", "explanation": "dict.get(key) returns the value for a key, or None if missing."},
  {"id": 3, "type": "mcq", "prompt": "What is the value?  d = {\"a\": 1}; print(d[\"a\"])", "options": ["1", "a", "Error", "None"], "answer": "1", "explanation": "d[\"a\"] looks up the value stored under the key \"a\", which is 1."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'data-structures'
ON CONFLICT (topic_id, slug) DO NOTHING;

INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'sets', 'Sets', 4, 10, '[
  {"id": 1, "type": "mcq", "prompt": "What is special about a set?", "options": ["No duplicates allowed", "Keeps insertion order", "Can be indexed", "Is always sorted"], "answer": "No duplicates allowed", "explanation": "Sets automatically remove duplicate values."},
  {"id": 2, "type": "mcq", "prompt": "What is  len({1, 2, 2, 3}) ?", "options": ["3", "4", "2", "1"], "answer": "3", "explanation": "Duplicates are removed: {1, 2, 3} has three items."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'data-structures'
ON CONFLICT (topic_id, slug) DO NOTHING;

-- Functions
INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'define', 'Defining Functions', 1, 15, '[
  {"id": 1, "type": "fill", "prompt": "Define a function:  ____ greet():", "code": "____ greet():", "answer": "def", "explanation": "The def keyword starts a function definition."},
  {"id": 2, "type": "mcq", "prompt": "What is the body of a function indented by?", "options": ["4 spaces", "No indentation", "A semicolon", "Curly braces"], "answer": "4 spaces", "explanation": "Python uses indentation (typically 4 spaces) to define blocks."},
  {"id": 3, "type": "mcq", "prompt": "How do you call a function named greet?", "options": ["greet()", "call greet", "greet;", "run greet"], "answer": "greet()", "explanation": "Use the function name followed by parentheses to call it."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'functions'
ON CONFLICT (topic_id, slug) DO NOTHING;

INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'parameters', 'Parameters & Return', 2, 15, '[
  {"id": 1, "type": "mcq", "prompt": "What keyword sends a value back from a function?", "options": ["return", "send", "out", "give"], "answer": "return", "explanation": "return passes a value back to the caller."},
  {"id": 2, "type": "fill", "prompt": "Finish the function so it returns x + 1:", "code": "def add_one(x):\n    ____ x + 1", "answer": "return", "explanation": "return x + 1 sends the computed value back."},
  {"id": 3, "type": "mcq", "prompt": "def add(a, b): return a + b  — what is  add(2, 3)?", "options": ["5", "23", "6", "Error"], "answer": "5", "explanation": "add(2, 3) returns 2 + 3 = 5."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'functions'
ON CONFLICT (topic_id, slug) DO NOTHING;

INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'defaults', 'Default Parameters', 3, 10, '[
  {"id": 1, "type": "mcq", "prompt": "def greet(name=\"world\") — what is  greet()  without arguments?", "options": ["Uses the default \"world\"", "Raises an error", "Prints nothing", "Returns None always"], "answer": "Uses the default \"world\"", "explanation": "When no argument is passed, the default value is used."},
  {"id": 2, "type": "fill", "prompt": "Give count a default value of 0:  def repeat(text, ____=0):", "code": "def repeat(text, ____=0):", "answer": "count", "answer_variants": ["count", "times"], "explanation": "The parameter count defaults to 0 when not supplied."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'functions'
ON CONFLICT (topic_id, slug) DO NOTHING;

-- Modules & Errors
INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'import', 'Importing Modules', 1, 10, '[
  {"id": 1, "type": "fill", "prompt": "Import the math module:  ____ math", "code": "____ math", "answer": "import", "explanation": "import math loads the math module so you can use math.sqrt, etc."},
  {"id": 2, "type": "mcq", "prompt": "How do you get the square root with math?", "options": ["math.sqrt(16)", "sqrt.math(16)", "math.square(16)", "Math.sqrt(16)"], "answer": "math.sqrt(16)", "explanation": "math.sqrt(16) returns 4.0."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'modules-errors'
ON CONFLICT (topic_id, slug) DO NOTHING;

INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'exceptions', 'Handling Errors', 2, 15, '[
  {"id": 1, "type": "fill", "prompt": "Catch an error:  ____:\n    risky()", "code": "try:\n    risky()\n____:", "answer": "except", "explanation": "except catches the error raised in the try block."},
  {"id": 2, "type": "mcq", "prompt": "What error happens for  int(\"abc\") ?", "options": ["ValueError", "TypeError", "SyntaxError", "ZeroDivisionError"], "answer": "ValueError", "explanation": "int(\"abc\") raises ValueError because \"abc\" cannot be converted to an integer."},
  {"id": 3, "type": "mcq", "prompt": "What is 1 / 0 in Python?", "options": ["ZeroDivisionError", "Infinity", "0", "None"], "answer": "ZeroDivisionError", "explanation": "Dividing by zero raises ZeroDivisionError in Python."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'modules-errors'
ON CONFLICT (topic_id, slug) DO NOTHING;

INSERT INTO learn_lessons (topic_id, slug, title, sort_order, xp_reward, questions)
SELECT t.id, 'builtins', 'Useful Built-ins', 3, 10, '[
  {"id": 1, "type": "mcq", "prompt": "What does  type(42)  return?", "options": ["<class \"int\">", "42", "int", "number"], "answer": "<class \"int\">", "explanation": "type() returns the type of the value — 42 is an int."},
  {"id": 2, "type": "mcq", "prompt": "What does  int(\"7\") + 1  equal?", "options": ["8", "\"71\"", "7", "Error"], "answer": "8", "explanation": "int(\"7\") converts the string to 7, then 7 + 1 = 8."},
  {"id": 3, "type": "mcq", "prompt": "What is  max(3, 9, 5) ?", "options": ["9", "3", "5", "17"], "answer": "9", "explanation": "max() returns the largest value: 9."}
]'::jsonb
FROM learn_topics t WHERE t.slug = 'modules-errors'
ON CONFLICT (topic_id, slug) DO NOTHING;
