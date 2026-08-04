-- ============================================
-- KLEIA - Learn: reference material for every lesson
-- Adds a 'material' column to learn_lessons and fills it with
-- beginner-friendly reading content for all 22 lessons.
-- Also adds lesson-link columns to ctf_challenges so challenges
-- can point at the lesson that teaches the needed technique.
-- Run this in Supabase SQL Editor
-- ============================================

-- ===== SCHEMA =====

ALTER TABLE learn_lessons
  ADD COLUMN IF NOT EXISTS material jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE ctf_challenges
  ADD COLUMN IF NOT EXISTS learn_topic_slug text,
  ADD COLUMN IF NOT EXISTS learn_lesson_slug text;

-- ===== MATERIAL: Python Basics =====

UPDATE learn_lessons SET material = $json$[
  {"heading": "What is print()?", "text": "print() is how a program shows text on the screen. You put what you want to show inside the parentheses, wrapped in quotes. Everything inside the quotes is called a string."},
  {"heading": "Example", "code": "print(\"Hello, World!\")"},
  {"heading": "In CTF", "text": "Scripts you write for challenges often print results, decoded text, or flags. If a challenge gives you a Python file, look for print() calls — they might reveal the output you need."},
  {"heading": "Try it", "bullets": ["Print your own name: print(\"Your name\")", "Print a number: print(42) — no quotes needed for numbers", "Print two things: print(\"score\", 10) — print separates them with a space"]}
]$json$::jsonb
WHERE slug = 'hello-world' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'python-basics');

UPDATE learn_lessons SET material = $json$[
  {"heading": "What is a variable?", "text": "A variable is a named box that stores a value. You create one with an equals sign: name = value. The value can be a number (int), a decimal (float), text (str), or true/false (bool)."},
  {"heading": "Example", "code": "age = 25\nscore = 99.5\nname = \"Alice\"\nlogged_in = True"},
  {"heading": "In CTF", "text": "Challenges often describe a number like a port, a password, or a score. Storing values in variables keeps your script readable and makes it easy to change one value without rewriting everything."},
  {"heading": "Try it", "bullets": ["Create a variable: level = 3", "Change it: level = level + 1", "Print it: print(level) — now it shows 4"]}
]$json$::jsonb
WHERE slug = 'variables' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'python-basics');

UPDATE learn_lessons SET material = $json$[
  {"heading": "What is a string?", "text": "A string is text stored in quotes. Strings let you hold names, flags, or messages. len() counts the characters, + joins strings, and * repeats one."},
  {"heading": "Example", "code": "word = \"hello\"\nprint(len(word))   # 5\nprint(word + \"!\")  # hello!\nprint(\"ha\" * 3)    # hahaha"},
  {"heading": "In CTF", "text": "Flags are strings. You often combine strings to build an answer (a prefix plus decoded text), check a string length, or repeat characters. Knowing how to slice and join strings is essential."},
  {"heading": "Try it", "bullets": ["Make a string: pet = \"cat\"", "Find its length: print(len(pet))", "Join them: print(pet + \"s\")"]}
]$json$::jsonb
WHERE slug = 'strings' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'python-basics');

UPDATE learn_lessons SET material = $json$[
  {"heading": "What is input()?", "text": "input() pauses the program and waits for the user to type something. It always gives you back a string, even if the user types numbers. Use int() or float() to convert."},
  {"heading": "Example", "code": "name = input(\"What is your name? \")\nprint(\"Hi\", name)"},
  {"heading": "In CTF", "text": "Some challenges are interactive — they ask a question and expect an answer. input() is how a script reads that reply. If a challenge says a program asks for a password, that is probably input() at work."},
  {"heading": "Try it", "bullets": ["Ask for a number: num = input(\"Enter a number: \")", "Convert it: num = int(num)", "Use it in math: print(num + 1)"]}
]$json$::jsonb
WHERE slug = 'input' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'python-basics');

-- ===== MATERIAL: Control Flow =====

UPDATE learn_lessons SET material = $json$[
  {"heading": "What is an if statement?", "text": "if lets your program make a decision. If the condition is true, the indented block runs. Otherwise, the else block runs (if there is one). The comparison operators are == (equal), != (not equal), >, <, >=, <=."},
  {"heading": "Example", "code": "age = 20\nif age >= 18:\n    print(\"Adult\")\nelse:\n    print(\"Minor\")"},
  {"heading": "In CTF", "text": "Challenges use conditions to check answers. For example, a script may check if your input matches a stored flag. Understanding if/else lets you read what condition a challenge is testing."},
  {"heading": "Try it", "bullets": ["Compare two numbers: if 5 > 3: print(\"bigger\")", "Test equality: if answer == \"flag\":", "Chain with else: add an else to run when the condition is false"]}
]$json$::jsonb
WHERE slug = 'if-else' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'control-flow');

UPDATE learn_lessons SET material = $json$[
  {"heading": "What is a for loop?", "text": "A for loop repeats a block of code once for each item. range(n) counts from 0 to n-1. Loops are perfect for repeating a task a set number of times or walking through a list."},
  {"heading": "Example", "code": "for i in range(3):\n    print(i)  # prints 0, 1, 2\n\nfor fruit in [\"apple\", \"kiwi\"]:\n    print(fruit)"},
  {"heading": "In CTF", "text": "Loops are everywhere in challenge scripts: brute-forcing a small key, trying every character, or applying a transformation to each letter of a string. Spotting a loop tells you something is repeated — often the secret to a challenge."},
  {"heading": "Try it", "bullets": ["Count to 5: for i in range(5): print(i)", "Loop a list: for item in items:", "Sum a range: total = 0; for i in range(1, 4): total += i"]}
]$json$::jsonb
WHERE slug = 'for-loops' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'control-flow');

UPDATE learn_lessons SET material = $json$[
  {"heading": "What is a while loop?", "text": "A while loop repeats as long as its condition is true. Unlike a for loop, you control when it stops yourself — usually by changing a counter inside the loop. If the condition is never false, it runs forever."},
  {"heading": "Example", "code": "count = 3\nwhile count > 0:\n    print(count)\n    count = count - 1\nprint(\"Done!\")"},
  {"heading": "In CTF", "text": "While loops appear in scripts that keep asking until the right answer, or that loop until a guess works. If you see while True, there must be a break somewhere — find it to understand the exit condition."},
  {"heading": "Try it", "bullets": ["Count up: start a variable at 0 and add 1 each loop", "Stop condition: keep going while count < 5", "Watch out: without a changing condition, the loop never ends"]}
]$json$::jsonb
WHERE slug = 'while-loops' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'control-flow');

UPDATE learn_lessons SET material = $json$[
  {"heading": "What are break and continue?", "text": "Inside a loop, break stops the loop completely and jumps out. continue skips the rest of this one run and jumps to the next. Both are used to fine-tune how a loop behaves."},
  {"heading": "Example", "code": "for i in range(10):\n    if i == 3:\n        break      # stop at 3\n    if i == 1:\n        continue   # skip printing 1\n    print(i)        # prints 0, 2"},
  {"heading": "In CTF", "text": "Scripts often break as soon as they find a match (the first correct guess), or continue to skip bad values. Recognizing these lets you see the logic: when does the loop decide to stop?"},
  {"heading": "Try it", "bullets": ["Break early: stop a count at 2", "Skip a value: skip printing even numbers", "Combine: find the first item that matches a condition"]}
]$json$::jsonb
WHERE slug = 'break-continue' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'control-flow');

-- ===== MATERIAL: Data Structures =====

UPDATE learn_lessons SET material = $json$[
  {"heading": "What is a list?", "text": "A list stores items in order, inside square brackets. Items are numbered from 0. Use append() to add to the end and len() to count them. Lists can be changed after creation."},
  {"heading": "Example", "code": "colors = [\"red\", \"green\", \"blue\"]\nprint(colors[0])   # red\ncolors.append(\"gold\")\nprint(len(colors)) # 4"},
  {"heading": "In CTF", "text": "Lists hold candidate answers, decoded characters, or a wordlist to try. If a challenge script builds a list and then joins or checks it, that list is likely part of the solution."},
  {"heading": "Try it", "bullets": ["Make a list: items = [1, 2, 3]", "Read one item: print(items[0])", "Add one: items.append(4)", "Count them: print(len(items))"]}
]$json$::jsonb
WHERE slug = 'lists' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'data-structures');

UPDATE learn_lessons SET material = $json$[
  {"heading": "What is a tuple?", "text": "A tuple is like a list, but it cannot be changed after creation (it is immutable). Tuples use parentheses instead of square brackets. Use them for values that should stay fixed, like coordinates."},
  {"heading": "Example", "code": "point = (3, 5)\nprint(point[0])   # 3\n# point[0] = 9  -> error! tuples cannot change"},
  {"heading": "In CTF", "text": "Tuples appear when a script groups fixed values — a (row, column), a (key, value), or ranges for a puzzle. Read the tuple to get the paired numbers."},
  {"heading": "Try it", "bullets": ["Make a tuple: pair = (1, 2)", "Read a value: print(pair[0])", "Try to change it and see the error"]}
]$json$::jsonb
WHERE slug = 'tuples' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'data-structures');

UPDATE learn_lessons SET material = $json$[
  {"heading": "What is a dictionary?", "text": "A dictionary stores key-value pairs inside curly braces. You look up a value by its key instead of a number. Use d[key] to get a value, and d.get(key) to get a value or None if missing."},
  {"heading": "Example", "code": "person = {\"name\": \"Alex\", \"age\": 30}\nprint(person[\"name\"])   # Alex\nprint(person.get(\"age\")) # 30"},
  {"heading": "In CTF", "text": "Dictionaries are used for mappings — letter to number, character to code, or password to username. Frequency analysis (counting how often each letter appears) is often done with a dictionary."},
  {"heading": "Try it", "bullets": ["Make a map: code = {\"a\": 1, \"b\": 2}", "Look up a value: print(code[\"a\"])", "Count with a dict: tally each character you see"]}
]$json$::jsonb
WHERE slug = 'dictionaries' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'data-structures');

UPDATE learn_lessons SET material = $json$[
  {"heading": "What is a set?", "text": "A set stores unique values inside curly braces. Duplicates are removed automatically, so a set is perfect for answering: which distinct items are here? Sets have no order and cannot be indexed."},
  {"heading": "Example", "code": "nums = {1, 2, 2, 3}\nprint(nums)      # {1, 2, 3}\nprint(len(nums)) # 3"},
  {"heading": "In CTF", "text": "Use a set to remove duplicate letters from decoded text, to check if a value appears at all, or to compare two collections for shared (unique) items."},
  {"heading": "Try it", "bullets": ["Make a set: s = {1, 1, 2}", "Check membership: 1 in s", "Remove duplicates from a list: set(mylist)"]}
]$json$::jsonb
WHERE slug = 'sets' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'data-structures');

-- ===== MATERIAL: Functions =====

UPDATE learn_lessons SET material = $json$[
  {"heading": "What is a function?", "text": "A function is a reusable block of code with a name. Define it with def, then call it by name followed by parentheses. Whatever you want inside the function must be indented under it."},
  {"heading": "Example", "code": "def greet():\n    print(\"Hello!\")\n\ngreet()   # Hello!\ngreet()   # Hello!"},
  {"heading": "In CTF", "text": "Challenge scripts wrap logic in functions so it can be called many times — try_shift(), decode(), check_flag(). Reading the function names and bodies tells you what the program does step by step."},
  {"heading": "Try it", "bullets": ["Define one: def hi(): print(\"hi\")", "Call it twice", "Add more lines inside (keep the indentation)"]}
]$json$::jsonb
WHERE slug = 'define' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'functions');

UPDATE learn_lessons SET material = $json$[
  {"heading": "What are parameters and return?", "text": "Parameters are inputs a function accepts. return sends a value back to the code that called it. A function with inputs and an output is like a machine: give it values, get a result."},
  {"heading": "Example", "code": "def add_one(x):\n    return x + 1\n\nresult = add_one(5)\nprint(result)   # 6"},
  {"heading": "In CTF", "text": "Challenge scripts use functions like decode(data, key) that return the processed result. Trace the return value — it often holds the decoded string or the flag."},
  {"heading": "Try it", "bullets": ["Make a function that returns a doubled number", "Store its result in a variable", "Use that variable in a print"]}
]$json$::jsonb
WHERE slug = 'parameters' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'functions');

UPDATE learn_lessons SET material = $json$[
  {"heading": "What are default parameters?", "text": "A default parameter has a fallback value used when the caller passes nothing. Set it with an equals sign in the definition. It makes functions flexible — callable with or without that argument."},
  {"heading": "Example", "code": "def greet(name=\"world\"):\n    return \"Hello \" + name\n\nprint(greet())        # Hello world\nprint(greet(\"Alex\"))  # Hello Alex"},
  {"heading": "In CTF", "text": "Default parameters often hide a standard value — a default key, a default shift amount, or a default encoding. Check the defaults in a challenge script; they are frequently the answer."},
  {"heading": "Try it", "bullets": ["Write a function with a default of 0", "Call it without arguments", "Call it with an argument and see the difference"]}
]$json$::jsonb
WHERE slug = 'defaults' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'functions');

-- ===== MATERIAL: Modules & Errors =====

UPDATE learn_lessons SET material = $json$[
  {"heading": "What is a module?", "text": "A module is a file of ready-made code you can bring in with import. It adds extra tools like math (math.sqrt) or string helpers. Use module.function() to call them."},
  {"heading": "Example", "code": "import math\nprint(math.sqrt(16))   # 4.0\n\nimport base64\nprint(base64.b64decode(\"aGk=\"))   # b'hi'"},
  {"heading": "In CTF", "text": "base64, hashlib, and itertools are challenge staples. Seeing an import at the top of a script tells you which tool the challenge uses — a big hint for solving it yourself."},
  {"heading": "Try it", "bullets": ["Import math and compute a square root", "Encode text with base64.b64encode", "Decode a short base64 string"]}
]$json$::jsonb
WHERE slug = 'import' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'modules-errors');

UPDATE learn_lessons SET material = $json$[
  {"heading": "What are exceptions?", "text": "An exception is an error that stops the program unless it is handled. try/except catches the error and runs fallback code instead. Common ones: ValueError, TypeError, ZeroDivisionError."},
  {"heading": "Example", "code": "try:\n    num = int(\"abc\")\nexcept ValueError:\n    print(\"That is not a number!\")"},
  {"heading": "In CTF", "text": "Challenge scripts wrap risky calls in try/except to keep running when an input is invalid. Understanding exceptions helps you see what could fail — and what inputs a challenge expects."},
  {"heading": "Try it", "bullets": ["Convert a bad string with int() and catch the error", "Add an except for ZeroDivisionError", "Print a friendly message instead of crashing"]}
]$json$::jsonb
WHERE slug = 'exceptions' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'modules-errors');

UPDATE learn_lessons SET material = $json$[
  {"heading": "What are built-ins?", "text": "Built-ins are functions available without any import: type(), int(), str(), max(), min(), len(), sum(), sorted(). They cover everyday conversions and quick math."},
  {"heading": "Example", "code": "print(type(42))     # <class 'int'>\nprint(int(\"7\") + 1) # 8\nprint(max(3, 9, 5)) # 9"},
  {"heading": "In CTF", "text": "Built-ins turn strings into numbers, find the biggest value, and count things. Many easy challenges are just a clever combination of built-ins applied to a given string."},
  {"heading": "Try it", "bullets": ["Convert a string number and add 1", "Find the max of three values", "Sum a list of numbers with sum()"]}
]$json$::jsonb
WHERE slug = 'builtins' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'modules-errors');

-- ===== MATERIAL: Linux Basics =====

UPDATE learn_lessons SET material = $json$[
  {"heading": "What are these commands?", "text": "ls lists files in a folder, cd changes the folder you are in, pwd prints your current folder, and cat shows a file on the screen. These are the first commands you need to explore a challenge directory."},
  {"heading": "Example", "code": "ls -la          # list everything, including hidden files\ncd secrets      # go into the secrets folder\npwd             # where am I?\ncat flag.txt    # print the flag file"},
  {"heading": "In CTF", "text": "Challenge files arrive as folders or archives. Use ls to see what you have, cd to move into it, and cat to read files. Hidden files (starting with a dot) often hide hints — ls -la reveals them."},
  {"heading": "Try it", "bullets": ["Run ls to see the files in a folder", "Look for hidden files with ls -la", "Read a file with cat"]}
]$json$::jsonb
WHERE slug = 'navigation' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'linux-basics');

UPDATE learn_lessons SET material = $json$[
  {"heading": "What are these commands?", "text": "grep searches inside files for matching text, find locates files by name, head prints the start of a file, and tail prints the end. These help you hunt for flags buried in lots of data."},
  {"heading": "Example", "code": "grep -r flag .        # search every file for the word flag\ngrep -i \"flag\" note.txt\nfind . -name \"*.txt\"  # find all txt files\nhead -n 5 data.txt    # first 5 lines\ntail -n 20 log.txt    # last 20 lines"},
  {"heading": "In CTF", "text": "When a flag is hidden somewhere in a large file or many files, grep is your best tool. Search for the flag prefix, search case-insensitively, and use find to locate suspicious files by name."},
  {"heading": "Try it", "bullets": ["Search a file for the word flag", "Search every file in a folder with grep -r", "Find files with a given extension using find"]}
]$json$::jsonb
WHERE slug = 'searching' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'linux-basics');

UPDATE learn_lessons SET material = $json$[
  {"heading": "What are these commands?", "text": "wget downloads a file from a URL, curl fetches URLs (and follows redirects with -L), unzip extracts .zip files, and tar -xzf extracts .tar.gz archives."},
  {"heading": "Example", "code": "wget https://example.com/file.zip\ncurl -L https://example.com/api\nunzip file.zip\ntar -xzf archive.tar.gz"},
  {"heading": "In CTF", "text": "Many challenges give you a file to download or an API to query. Download it with wget, extract it with unzip or tar, and use curl when a challenge endpoint responds with JSON or needs special headers."},
  {"heading": "Try it", "bullets": ["Download a file with wget", "Extract it with unzip or tar -xzf", "Use curl -L to follow a redirect"]}
]$json$::jsonb
WHERE slug = 'downloads' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'linux-basics');

UPDATE learn_lessons SET material = $json$[
  {"heading": "What are these commands?", "text": "cp copies a file, mv moves or renames it, rm deletes it, and chmod changes permissions — like adding execute (+x) to a script. These keep your workspace organized and make scripts runnable."},
  {"heading": "Example", "code": "cp source.txt backup.txt\nmv old.txt new.txt\nrm temp.txt\nchmod +x solve.sh\n./solve.sh"},
  {"heading": "In CTF", "text": "You will often copy files before experimenting, rename them to the right extension, delete junk, and chmod +x a script so you can run it. Note: rm is permanent — there is no undo."},
  {"heading": "Try it", "bullets": ["Copy a file with cp", "Rename it with mv", "Make a script executable with chmod +x and run it"]}
]$json$::jsonb
WHERE slug = 'file-ops' AND topic_id = (SELECT id FROM learn_topics WHERE slug = 'linux-basics');
