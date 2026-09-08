-- Add a practical terminal decoding lesson to the existing Linux track.
DO $lesson$
DECLARE
  linux_topic_id uuid;
BEGIN
  SELECT id INTO linux_topic_id
  FROM public.learn_topics
  WHERE slug = 'linux-basics'
  LIMIT 1;

  IF linux_topic_id IS NULL THEN
    RAISE EXCEPTION 'Expected learn topic linux-basics to exist';
  END IF;

  INSERT INTO public.learn_lessons (
    topic_id,
    slug,
    title,
    sort_order,
    xp_reward,
    material,
    questions
  ) VALUES (
    linux_topic_id,
    'terminal-decoding-basics',
    'Terminal Decoding Basics',
    5,
    20,
    $json$[
      {
        "heading": "A repeatable decoding workflow",
        "text": "In CTFs, first identify the encoding from its alphabet and shape, then decode a copy of the value in the terminal. Keep the original unchanged and verify the result (for example, by checking for a readable sentence or a KLEIA{...} flag). Encoding is not encryption: the right decoder is usually enough.",
        "bullets": [
          "Copy the value into a temporary file or shell variable.",
          "Decode one layer at a time and inspect the output before continuing.",
          "Treat unexpected output as a clue that the encoding or input is wrong."
        ]
      },
      {
        "heading": "Base64",
        "text": "Base64 commonly uses letters, digits, +, /, and optional = padding.",
        "code": "printf '%s' 'S0xFSUF7YmFzZTY0X2RlY29kZWR9' | base64 -d\n# KLEIA{base64_decoded}"
      },
      {
        "heading": "ROT13",
        "text": "ROT13 rotates each letter by 13 positions. It is symmetrical, so the same command encodes and decodes.",
        "code": "printf '%s' 'X Y R V N {ebg13_qrpbqrf}' | tr 'A-Za-z' 'N-ZA-Mn-za-m'\n# KLEIA{rot13_decodes}"
      },
      {
        "heading": "Hexadecimal",
        "text": "A hex string has pairs of hexadecimal digits (0-9 and a-f). xxd converts those pairs back to bytes.",
        "code": "printf '%s' '4b4c4549417b6865785f6465636f6465647d' | xxd -r -p\n# KLEIA{hex_decoded}"
      },
      {
        "heading": "URL encoding",
        "text": "Percent escapes such as %20 represent bytes in a URL. Python's standard library can decode them without installing anything.",
        "code": "python3 -c \"from urllib.parse import unquote; print(unquote('KLEIA%7Burl_decoded%7D'))\"\n# KLEIA{url_decoded}"
      },
      {
        "heading": "Safety checklist",
        "bullets": [
          "Never pipe unknown decoded data into sh, bash, or another interpreter.",
          "Use printf instead of echo when exact bytes and trailing newlines matter.",
          "If a value still looks encoded, inspect it and decode the next layer deliberately."
        ]
      }
    ]$json$::jsonb,
    $json$[
      {
        "id": 1,
        "type": "mcq",
        "prompt": "Which command decodes Base64 from standard input?",
        "options": ["base64 -d", "xxd -r -p", "tr 'A-Za-z' 'N-ZA-Mn-za-m'", "curl -I"],
        "answer": "base64 -d",
        "explanation": "base64 -d decodes Base64 input; the other commands serve different purposes."
      },
      {
        "id": 2,
        "type": "mcq",
        "prompt": "What does ROT13 do?",
        "options": ["Rotates letters by 13 places", "Converts bytes to hexadecimal", "Downloads a URL", "Compresses a file"],
        "answer": "Rotates letters by 13 places",
        "explanation": "ROT13 substitutes each letter with the one 13 positions away in the alphabet."
      },
      {
        "id": 3,
        "type": "fill",
        "prompt": "Complete the command that turns hexadecimal text back into bytes: xxd -r - ____",
        "answer": "p",
        "answer_variants": ["-p", "p"],
        "explanation": "xxd -r -p reverses a plain hexadecimal dump."
      },
      {
        "id": 4,
        "type": "fill",
        "prompt": "Which Python function decodes percent escapes in a URL?",
        "answer": "urllib.parse.unquote",
        "answer_variants": ["unquote"],
        "explanation": "urllib.parse.unquote converts sequences such as %20 back to their characters."
      },
      {
        "id": 5,
        "type": "mcq",
        "prompt": "What is the safest next step after decoding an unfamiliar value?",
        "options": ["Inspect the output before decoding another layer", "Execute it as a shell script", "Paste it into an interpreter immediately", "Delete the original value"],
        "answer": "Inspect the output before decoding another layer",
        "explanation": "Decoded data may contain commands or additional encodings, so inspect it before doing anything else."
      }
    ]$json$::jsonb
  )
  ON CONFLICT DO NOTHING;
END $lesson$;
