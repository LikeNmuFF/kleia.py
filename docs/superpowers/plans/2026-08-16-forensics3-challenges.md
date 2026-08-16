# Forensics 3 Challenge Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 10 new solvable forensics challenges (XOR'd pcap, steghide BMP/WAV, zsteg PNG, jsteg JPEG, bit-plane, whitespace, appended ZIP, WAV LSB, PNG tEXt) that are generated, **solved-and-verified first**, then uploaded to Cloudinary and seeded into `ctf_challenges`.

**Architecture:** Three scripts following the existing `gen-forensics.py` → `seed-forensics.js` pattern: `scripts/gen-forensics3.py` generates all 10 artifacts into `scripts/forensics-artifacts/`; `scripts/solve-forensics3.py` actually solves each with real tools (steghide, zsteg, jsteg, custom parsers) and writes `verified.json` ONLY if all 10 extract the exact expected flag; `scripts/seed-forensics3.js` refuses to run without `verified.json`, uploads files to Cloudinary raw (`folder=kleia/ctf/forensics`), and inserts into `ctf_challenges`. No DB migration needed — `file_url` already exists.

**Tech Stack:** Python 3.12 + Pillow (installed), steghide 0.5.1 (installed), zsteg 0.2.14 (installed), jsteg (built to `~/go/bin/jsteg`), binwalk 2.3.3 (installed), Node 20 + @supabase/supabase-js, Cloudinary REST API. All tools verified working locally in `/tmp/opencode/steg-test`.

## Global Constraints

- Flags live in `flags.env` at repo root, format `FLAG_FORENSICS_3_<NAME>=KLEIA{...}`; loaded via the same `getFlag()` pattern as `seed-forensics.js`. **`flags.env` is git-ignored — never commit it.**
- Artifacts go in `scripts/forensics-artifacts/` (already exists, git-tracked).
- Cloudinary: raw upload to `folder=kleia/ctf/forensics`, signed with `sha1(folder=kleia/ctf/forensics&timestamp=<ts> + API_SECRET)`.
- Points scale: easy 100–150, medium 200–300, hard 400–600.
- `ADMIN_ID = 'ea020b54-40fd-4c92-9c83-aa1d305a5de0'`, `AUTHOR = 'Kleia CTF'` (same as existing seeders).
- `verified.json` format: `{"verified": true, "files": {"<filename>": {"sha256": "<hex>", "flag_key": "FLAG_FORENSICS_3_<NAME>"}}}`.
- steghide supports JPEG/BMP/WAV/AU (NOT PNG) — use BMP and WAV covers.
- jsteg is built at `~/go/bin/jsteg` (module path `lukechampine.com/jsteg`, build from `cmd/jsteg`).

---

### Task 1: Add the 10 new flags to `flags.env`

**Files:**
- Modify: `flags.env`

- [ ] **Step 1: Append the 10 flags**

Append this block to the end of `flags.env` (use the Edit tool; match existing style with a comment header):

```env
# --- Forensics 3 Challenges (scripts/gen-forensics3.py / seed-forensics3.js) ---
FLAG_FORENSICS_3_STREAMXOR=KLEIA{x0r_1s_n0t_3ncrypt10n}
FLAG_FORENSICS_3_STEGIMAGE=KLEIA{st3gh1d3_1n_1m4g3s}
FLAG_FORENSICS_3_STEGAUDIO=KLEIA{st3gh1d3_1n_4ud10}
FLAG_FORENSICS_3_ZSTEG=KLEIA{zst3g_f0und_th3_p4yl04d}
FLAG_FORENSICS_3_JSTEG=KLEIA{jst3g_dct_c03ff1c13nts}
FLAG_FORENSICS_3_BITPLANE=KLEIA{b1tpl4n3_0f_th3_r3d_ch4nn3l}
FLAG_FORENSICS_3_WHITESPACE=KLEIA{wh1t3sp4c3_1s_s3cr3t_c0d3}
FLAG_FORENSICS_3_APPENDZIP=KLEIA{b1nw4lk_th3_4pp3nd3d_z1p}
FLAG_FORENSICS_3_WAVLSB=KLEIA{lsb_1n_th3_w4v3f0rm}
FLAG_FORENSICS_3_PNGTEXT=KLEIA{t3xt_chunk_c4rr13s_th3_fl4g}
```

- [ ] **Step 2: Verify they load**

```bash
grep -c "^FLAG_FORENSICS_3_" flags.env
```

Expected: `10`. Do NOT commit this file.

---

### Task 2: Create `scripts/gen-forensics3.py` (generates all 10 artifacts)

**Files:**
- Create: `scripts/gen-forensics3.py`

**Interfaces:**
- Produces: artifacts in `scripts/forensics-artifacts/` named exactly:
  `stream_xor.pcap`, `steg_image.bmp`, `steg_audio.wav`, `zsteg.png`, `jsteg.jpg`, `bitplane.png`, `whitespace.txt`, `appended.zip.png`, `wav_lsb.wav`, `text_chunk.png`.
- Produces: `get_flag(key)` helper reading `flags.env`.
- Consumes: `flags.env` (Task 1).

- [ ] **Step 1: Write the script**

Create `scripts/gen-forensics3.py` with this full content:

```python
#!/usr/bin/env python3
"""Generate 10 forensics challenge artifacts (batch 3).

Each generator writes exactly one artifact into scripts/forensics-artifacts/.
Flags come from ../../flags.env. No verification here — run solve-forensics3.py
to actually solve and verify every artifact before seeding.
"""
import io
import math
import os
import struct
import subprocess
import wave
import zipfile
import zlib
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "forensics-artifacts"
OUT.mkdir(exist_ok=True)

# ---- flags ----
def _load_flags():
    env = {}
    for line in (ROOT / "flags.env").read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()
    return env

FLAGS = _load_flags()

def get_flag(key: str) -> str:
    val = FLAGS.get(key)
    if not val:
        raise SystemExit(f"Missing {key} in flags.env")
    return val

JSTEG = os.path.expanduser("~/go/bin/jsteg")

def _run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)

# ---- pcap helpers (mirror seed-forensics.js) ----
def ip_to_int(ip):
    return (struct.unpack(">I", bytes(map(int, ip.split("."))))[0])

def calc_checksum(header):
    if len(header) % 2:
        header += b"\x00"
    total = sum(struct.unpack(f">{len(header)//2}H", header))
    while total > 0xFFFF:
        total = (total & 0xFFFF) + (total >> 16)
    return (~total) & 0xFFFF

def build_packet(src_ip, dst_ip, src_port, dst_port, tcp_flags, payload):
    payload = payload.encode("ascii") if isinstance(payload, str) else payload
    tcp = bytearray(20)
    struct.pack_into(">H", tcp, 0, src_port)
    struct.pack_into(">H", tcp, 2, dst_port)
    tcp[12] = 0x50
    tcp[13] = tcp_flags
    tcp_len = 20 + len(payload)
    pseudo = struct.pack(">I", ip_to_int(src_ip)) + struct.pack(">I", ip_to_int(dst_ip)) + b"\x00\x06" + struct.pack(">H", tcp_len)
    tcp_checksum = calc_checksum(pseudo + bytes(tcp) + payload)
    struct.pack_into(">H", tcp, 16, tcp_checksum)
    ip = bytearray(20)
    ip[0] = 0x45
    struct.pack_into(">H", ip, 2, 20 + tcp_len)
    struct.pack_into(">H", ip, 6, 0x4000)
    ip[8] = 64
    ip[9] = 6
    ip[12:16] = struct.pack(">I", ip_to_int(src_ip))
    ip[16:20] = struct.pack(">I", ip_to_int(dst_ip))
    struct.pack_into(">H", ip, 10, calc_checksum(bytes(ip)))
    eth = b"\x00" * 12 + struct.pack(">H", 0x0800)
    return eth + bytes(ip) + bytes(tcp) + payload

def make_pcap(packets):
    gh = struct.pack("<IHHiIII", 0xA1B2C3D4, 2, 4, 0, 0, 65535, 1)
    now = 1700000000
    parts = [gh]
    for pkt in packets:
        parts.append(struct.pack("<IIII", now, 0, len(pkt), len(pkt)))
        parts.append(pkt)
    return b"".join(parts)

# ---- C1: XOR'd TCP stream (non-grepable pcap) ----
def gen_stream_xor():
    flag = get_flag("FLAG_FORENSICS_3_STREAMXOR")
    key = 0x2A
    encrypted = bytes(b ^ key for b in flag.encode("ascii"))
    http_payload = b"POST /api/flag HTTP/1.1\r\nHost: target.local\r\nContent-Type: text/plain\r\n\r\n" + encrypted
    pkt = build_packet("192.168.1.100", "10.0.0.5", 54321, 80, 0x18, http_payload)
    (OUT / "stream_xor.pcap").write_bytes(make_pcap([pkt]))

# ---- C2: steghide BMP ----
def gen_steg_image():
    flag = get_flag("FLAG_FORENSICS_3_STEGIMAGE")
    img = Image.new("RGB", (400, 400), (200, 150, 100))
    cover = OUT / "_cover.bmp"
    secret = OUT / "_secret.txt"
    img.save(cover, "BMP")
    secret.write_text(flag)
    r = _run(["steghide", "embed", "-cf", str(cover), "-ef", str(secret),
              "-sf", str(OUT / "steg_image.bmp"), "-p", "kleia_rock_2026", "-f"])
    if r.returncode != 0:
        raise SystemExit(f"steghide embed BMP failed: {r.stderr}")
    cover.unlink(); secret.unlink()

# ---- C3: steghide WAV ----
def gen_steg_audio():
    flag = get_flag("FLAG_FORENSICS_3_STEGAUDIO")
    rate, dur = 44100, 2
    with wave.open(str(OUT / "_cover.wav"), "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
        frames = b"".join(
            struct.pack("<h", int(15000 * math.sin(2 * math.pi * 440 * i / rate)))
            for i in range(rate * dur)
        )
        w.writeframes(frames)
    secret = OUT / "_secret_audio.txt"
    secret.write_text(flag)
    r = _run(["steghide", "embed", "-cf", str(OUT / "_cover.wav"), "-ef", str(secret),
              "-sf", str(OUT / "steg_audio.wav"), "-p", "kleia_audio_2026", "-f"])
    if r.returncode != 0:
        raise SystemExit(f"steghide embed WAV failed: {r.stderr}")
    (OUT / "_cover.wav").unlink(); secret.unlink()

# ---- C4: zsteg PNG (LSB in RGB) ----
def gen_zsteg():
    flag = get_flag("FLAG_FORENSICS_3_ZSTEG")
    w = h = 300
    img = Image.new("RGB", (w, h), (200, 150, 100))
    pix = img.load()
    bits = "".join(f"{ord(c):08b}" for c in flag)
    idx = 0
    for y in range(h):
        for x in range(w):
            r, g, b = pix[x, y]
            if idx < len(bits):
                r = (r & 0xFE) | int(bits[idx]); idx += 1
            pix[x, y] = (r, g, b)
    img.save(OUT / "zsteg.png")

# ---- C5: jsteg JPEG (DCT coefficient LSB) ----
def gen_jsteg():
    flag = get_flag("FLAG_FORENSICS_3_JSTEG")
    img = Image.new("RGB", (900, 900), (120, 90, 40))
    # add subtle noise so DCT has coefficients to hide in
    import random
    random.seed(42)
    pix = img.load()
    for y in range(900):
        for x in range(900):
            r, g, b = pix[x, y]
            pix[x, y] = (
                min(255, max(0, r + random.randint(-30, 30))),
                min(255, max(0, g + random.randint(-30, 30))),
                min(255, max(0, b + random.randint(-30, 30))),
            )
    cover = OUT / "_cover.jpg"
    secret = OUT / "_secret_jsteg.txt"
    img.save(cover, "JPEG", quality=95)
    secret.write_text(flag)
    r = _run([JSTEG, "hide", str(cover), str(secret), str(OUT / "jsteg.jpg")])
    if r.returncode != 0:
        raise SystemExit(f"jsteg hide failed: {r.stderr}")
    cover.unlink(); secret.unlink()

# ---- C6: bit-plane (flag text in red channel bit 0) ----
GLYPH5X7 = {
    "K": ["101", "101", "111", "101", "101"],
    "L": ["100", "100", "100", "100", "111"],
    "E": ["111", "100", "111", "100", "111"],
    "I": ["111", "001", "001", "001", "111"],
    "A": ["111", "101", "111", "101", "101"],
    "{": ["011", "100", "100", "100", "011"],
    "x": ["101", "101", "011", "101", "101"],
    "0": ["111", "101", "101", "101", "111"],
    "r": ["110", "101", "100", "100", "100"],
    "1": ["010", "110", "010", "010", "111"],
    "s": ["011", "100", "110", "001", "110"],
    "n": ["110", "101", "101", "101", "101"],
    "t": ["010", "111", "010", "010", "010"],
    "3": ["111", "001", "011", "001", "111"],
    "c": ["011", "101", "101", "101", "011"],
    "h": ["100", "111", "101", "101", "101"],
    "4": ["101", "101", "111", "001", "001"],
    "n2": ["101", "101", "101", "101", "111"],
    "d": ["001", "011", "101", "101", "011"],
    "f": ["011", "010", "111", "010", "010"],
    "g": ["011", "101", "011", "001", "110"],
    "_": ["000", "000", "111", "000", "000"],
    "o": ["110", "101", "101", "101", "110"],
    "l": ["010", "010", "010", "010", "011"],
    "p": ["110", "101", "110", "100", "100"],
    "a": ["110", "101", "101", "101", "110"],
    "b": ["100", "110", "101", "101", "110"],
    "w": ["101", "101", "101", "111", "101"],
    "m": ["101", "111", "111", "101", "101"],
    "u": ["101", "101", "101", "101", "011"],
    "}": ["110", "001", "001", "001", "110"],
}

def gen_bitplane():
    flag = get_flag("FLAG_FORENSICS_3_BITPLANE")
    w, h = 420, 100
    img = Image.new("RGB", (w, h), (255, 255, 255))
    pix = img.load()
    x, y0 = 20, 30
    for ch in flag:
        glyph = GLYPH5X7.get(ch)
        if glyph is None:
            continue  # unsupported char -> skipped
        for gy, row in enumerate(glyph):
            for gx, cell in enumerate(row):
                if cell == "1":
                    r, g, b = pix[x + gx, y0 + gy]
                    pix[x + gx, y0 + gy] = (r & 0xFE, g, b)  # bit0 = 0 => dark in plane
        x += 4
    img.save(OUT / "bitplane.png")

# ---- C7: whitespace stego (space=0, tab=1, trailing per line) ----
def gen_whitespace():
    flag = get_flag("FLAG_FORENSICS_3_WHITESPACE")
    bits = "".join(f"{ord(c):08b}" for c in flag)
    lines = []
    for b in bits:
        lines.append("hello" + (" " if b == "0" else "\t"))
    (OUT / "whitespace.txt").write_text("\n".join(lines) + "\n")

# ---- C8: appended ZIP after PNG (binwalk) ----
def gen_appended_zip():
    flag = get_flag("FLAG_FORENSICS_3_APPENDZIP")
    img = Image.new("RGB", (120, 120), (10, 200, 30))
    buf = io.BytesIO()
    img.save(buf, "PNG")
    png = buf.getvalue()
    zbuf = io.BytesIO()
    with zipfile.ZipFile(zbuf, "w") as z:
        z.writestr("flag.txt", flag)
    (OUT / "appended.zip.png").write_bytes(png + zbuf.getvalue())

# ---- C9: WAV LSB (LSB of 16-bit samples) ----
def gen_wav_lsb():
    flag = get_flag("FLAG_FORENSICS_3_WAVLSB")
    bits = "".join(f"{ord(c):08b}" for c in flag)
    rate, dur = 44100, 3
    samples = [int(18000 * math.sin(2 * math.pi * 330 * i / rate)) for i in range(rate * dur)]
    for i, b in enumerate(bits):
        samples[i] = (samples[i] & ~1) | int(b)
    with wave.open(str(OUT / "wav_lsb.wav"), "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
        w.writeframes(b"".join(struct.pack("<h", s) for s in samples))

# ---- C10: PNG tEXt chunk (Comment keyword) ----
def gen_text_chunk():
    flag = get_flag("FLAG_FORENSICS_3_PNGTEXT")
    img = Image.new("RGB", (80, 80), (150, 150, 150))
    buf = io.BytesIO()
    img.save(buf, "PNG")
    data = bytearray(buf.getvalue())
    keyword = b"Comment"
    text = keyword + b"\x00" + flag.encode("ascii")
    chunk = (
        struct.pack(">I", len(text))
        + b"tEXt"
        + text
        + struct.pack(">I", zlib.crc32(b"tEXt" + text) & 0xFFFFFFFF)
    )
    i = 8
    while i < len(data) - 8:
        ln = struct.unpack(">I", bytes(data[i:i + 4]))[0]
        if bytes(data[i + 4:i + 8]) == b"IEND":
            data[i:i] = chunk
            break
        i += 12 + ln
    (OUT / "text_chunk.png").write_bytes(bytes(data))

GENERATORS = [
    ("stream_xor.pcap", gen_stream_xor),
    ("steg_image.bmp", gen_steg_image),
    ("steg_audio.wav", gen_steg_audio),
    ("zsteg.png", gen_zsteg),
    ("jsteg.jpg", gen_jsteg),
    ("bitplane.png", gen_bitplane),
    ("whitespace.txt", gen_whitespace),
    ("appended.zip.png", gen_appended_zip),
    ("wav_lsb.wav", gen_wav_lsb),
    ("text_chunk.png", gen_text_chunk),
]

if __name__ == "__main__":
    print("=== Generating Forensics 3 artifacts ===\n")
    for name, fn in GENERATORS:
        try:
            fn()
            print(f"  OK {name} ({os.path.getsize(OUT / name)} bytes)")
        except Exception as e:
            print(f"  FAIL {name}: {e}")
    print("\nDone.")
```

- [ ] **Step 2: Run it and confirm all 10 artifacts exist**

```bash
python3 scripts/gen-forensics3.py
```

Expected: `OK <name>` for all 10. Then:

```bash
ls -la scripts/forensics-artifacts/ | grep -E "stream_xor|steg_image|steg_audio|zsteg|jsteg|bitplane|whitespace|appended|wav_lsb|text_chunk"
```

Expected: 10 files listed.

- [ ] **Step 3: Commit**

```bash
git add scripts/gen-forensics3.py
git commit -m "feat: add forensics 3 artifact generators"
```

---

### Task 3: Create `scripts/solve-forensics3.py` (solves & verifies all 10)

**Files:**
- Create: `scripts/solve-forensics3.py`

**Interfaces:**
- Consumes: artifacts from Task 2 + `flags.env` flags.
- Produces: `scripts/forensics-artifacts/verified.json` — written ONLY when all 10 solve and extract the exact flag.
- Exit code 0 = all verified; non-zero = failure.

- [ ] **Step 1: Write the script**

Create `scripts/solve-forensics3.py` with this full content:

```python
#!/usr/bin/env python3
"""Solve and verify every Forensics 3 artifact with real tools.

For each challenge this runs the same tool a player would use (steghide,
zsteg, jsteg, binwalk-style parse, custom decoder) and asserts the extracted
value equals the expected flag from flags.env. Only if all 10 pass does it
write scripts/forensics-artifacts/verified.json. Exit non-zero otherwise.
"""
import hashlib
import io
import json
import os
import re
import struct
import subprocess
import wave
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "forensics-artifacts"
VERIFIED = OUT / "verified.json"

def _load_flags():
    env = {}
    for line in (ROOT / "flags.env").read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()
    return env

FLAGS = _load_flags()

def get_flag(key: str) -> str:
    val = FLAGS.get(key)
    if not val:
        raise SystemExit(f"Missing {key} in flags.env")
    return val

def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def _run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)

# ---- C1: parse pcap, XOR the payload, find KLEIA ----
def solve_stream_xor(path: Path) -> str:
    data = path.read_bytes()
    assert data[:4] == b"\xd4\xc3\xb2\xa1", "not a pcap"
    off = 24
    payloads = []
    while off + 16 <= len(data):
        incl_len = struct.unpack_from("<I", data, off + 8)[0]
        pkt = data[off + 16: off + 16 + incl_len]
        if len(pkt) >= 54:
            payloads.append(pkt[54:])  # strip eth(14)+ip(20)+tcp(20)
        off += 16 + incl_len
    blob = b"".join(payloads)
    for key in range(256):
        dec = bytes(b ^ key for b in blob)
        m = re.search(rb"KLEIA\{[^}]+\}", dec)
        if m:
            flag = m.group(0).decode()
            assert flag == get_flag("FLAG_FORENSICS_3_STREAMXOR"), f"flag mismatch: {flag}"
            return flag
    raise AssertionError("XOR key not found")

# ---- C2/C3: steghide extract ----
def solve_steghide(path: Path, passphrase: str, flag_key: str) -> str:
    out = OUT / "_extracted.txt"
    if out.exists():
        out.unlink()
    r = _run(["steghide", "extract", "-sf", str(path), "-xf", str(out), "-p", passphrase, "-f"])
    if r.returncode != 0:
        raise AssertionError(f"steghide extract failed: {r.stderr}")
    flag = out.read_text().strip()
    assert flag == get_flag(flag_key), f"flag mismatch: {flag}"
    out.unlink()
    return flag

# ---- C4: zsteg -a ----
def solve_zsteg(path: Path) -> str:
    r = _run(["zsteg", "-a", str(path)])
    text = r.stdout + r.stderr
    m = re.search(r"KLEIA\{[^}]+\}", text)
    if not m:
        raise AssertionError(f"zsteg found no flag: {text[-500:]}")
    flag = m.group(0)
    assert flag == get_flag("FLAG_FORENSICS_3_ZSTEG"), f"flag mismatch: {flag}"
    return flag

# ---- C5: jsteg reveal ----
def solve_jsteg(path: Path) -> str:
    out = OUT / "_jsteg_out.txt"
    if out.exists():
        out.unlink()
    jsteg = os.path.expanduser("~/go/bin/jsteg")
    r = _run([jsteg, "reveal", str(path), str(out)])
    if r.returncode != 0:
        raise AssertionError(f"jsteg reveal failed: {r.stderr}")
    flag = out.read_text().strip()
    assert flag == get_flag("FLAG_FORENSICS_3_JSTEG"), f"flag mismatch: {flag}"
    out.unlink()
    return flag

# ---- C6: extract red bit-0 plane and decode 5x7 glyphs ----
GLYPH5X7 = {
    "K": ["101", "101", "111", "101", "101"],
    "L": ["100", "100", "100", "100", "111"],
    "E": ["111", "100", "111", "100", "111"],
    "I": ["111", "001", "001", "001", "111"],
    "A": ["111", "101", "111", "101", "101"],
    "{": ["011", "100", "100", "100", "011"],
    "x": ["101", "101", "011", "101", "101"],
    "0": ["111", "101", "101", "101", "111"],
    "r": ["110", "101", "100", "100", "100"],
    "1": ["010", "110", "010", "010", "111"],
    "s": ["011", "100", "110", "001", "110"],
    "n": ["110", "101", "101", "101", "101"],
    "t": ["010", "111", "010", "010", "010"],
    "3": ["111", "001", "011", "001", "111"],
    "c": ["011", "101", "101", "101", "011"],
    "h": ["100", "111", "101", "101", "101"],
    "4": ["101", "101", "111", "001", "001"],
    "d": ["001", "011", "101", "101", "011"],
    "f": ["011", "010", "111", "010", "010"],
    "g": ["011", "101", "011", "001", "110"],
    "_": ["000", "000", "111", "000", "000"],
    "o": ["110", "101", "101", "101", "110"],
    "l": ["010", "010", "010", "010", "011"],
    "p": ["110", "101", "110", "100", "100"],
    "a": ["110", "101", "101", "101", "110"],
    "b": ["100", "110", "101", "101", "110"],
    "w": ["101", "101", "101", "111", "101"],
    "m": ["101", "111", "111", "101", "101"],
    "u": ["101", "101", "101", "101", "011"],
    "}": ["110", "001", "001", "001", "110"],
}

def solve_bitplane(path: Path) -> str:
    from PIL import Image
    img = Image.open(path).convert("RGB")
    w, h = img.size
    pix = img.load()
    # scan text rows starting at y=30, x=20, advancing 4px per char
    rows = {}
    for y in range(30, 35):
        rows[y] = "".join("1" if (pix[x, y][0] & 1) == 0 else "0" for x in range(20, w))
    out = ""
    for start in range(0, w - 20 - 3, 4):
        col = "".join(rows[y][start:start + 3] for y in range(30, 35))
        match = None
        for ch, glyph in GLYPH5X7.items():
            g = "".join(glyph)
            if g == col:
                match = ch
                break
        if match:
            out += match
        else:
            break
    assert out.startswith("KLEIA{"), f"bit plane decode failed: {out!r}"
    assert out == get_flag("FLAG_FORENSICS_3_BITPLANE"), f"flag mismatch: {out}"
    return out

# ---- C7: whitespace decoder ----
def solve_whitespace(path: Path) -> str:
    bits = ""
    for line in path.read_text().split("\n"):
        if line.endswith("\t"):
            bits += "1"
        elif line.endswith(" "):
            bits += "0"
    out = "".join(chr(int(bits[i:i + 8], 2)) for i in range(0, len(bits), 8))
    assert out == get_flag("FLAG_FORENSICS_3_WHITESPACE"), f"flag mismatch: {out}"
    return out

# ---- C8: find appended ZIP and extract ----
def solve_appended_zip(path: Path) -> str:
    data = path.read_bytes()
    idx = data.find(b"PK\x03\x04")
    assert idx > 0, "no ZIP signature found"
    zf = zipfile.ZipFile(io.BytesIO(data[idx:]))
    flag = zf.read("flag.txt").decode().strip()
    assert flag == get_flag("FLAG_FORENSICS_3_APPENDZIP"), f"flag mismatch: {flag}"
    return flag

# ---- C9: WAV LSB ----
def solve_wav_lsb(path: Path) -> str:
    with wave.open(str(path), "r") as w:
        frames = w.readframes(w.getnframes())
    samples = struct.unpack(f"<{len(frames)//2}h", frames)
    bits = "".join(str(s & 1) for s in samples)
    out = "".join(chr(int(bits[i:i + 8], 2)) for i in range(0, len(bits), 8))
    m = re.search(r"KLEIA\{[^}]+\}", out)
    assert m, "no KLEIA flag found in LSB stream"
    flag = m.group(0)
    assert flag == get_flag("FLAG_FORENSICS_3_WAVLSB"), f"flag mismatch: {flag}"
    return flag

# ---- C10: read PNG tEXt chunk ----
def solve_text_chunk(path: Path) -> str:
    data = path.read_bytes()
    i = 8
    while i + 12 <= len(data):
        ln = struct.unpack(">I", data[i:i + 4])[0]
        ctype = data[i + 4:i + 8]
        if ctype == b"tEXt":
            payload = data[i + 8:i + 8 + ln]
            keyword, _, value = payload.partition(b"\x00")
            if keyword == b"Comment":
                flag = value.decode("ascii")
                assert flag == get_flag("FLAG_FORENSICS_3_PNGTEXT"), f"flag mismatch: {flag}"
                return flag
        i += 12 + ln
    raise AssertionError("tEXt Comment chunk not found")

SOLVERS = [
    ("stream_xor.pcap", "FLAG_FORENSICS_3_STREAMXOR", lambda p: solve_stream_xor(p)),
    ("steg_image.bmp", "FLAG_FORENSICS_3_STEGIMAGE", lambda p: solve_steghide(p, "kleia_rock_2026", "FLAG_FORENSICS_3_STEGIMAGE")),
    ("steg_audio.wav", "FLAG_FORENSICS_3_STEGAUDIO", lambda p: solve_steghide(p, "kleia_audio_2026", "FLAG_FORENSICS_3_STEGAUDIO")),
    ("zsteg.png", "FLAG_FORENSICS_3_ZSTEG", lambda p: solve_zsteg(p)),
    ("jsteg.jpg", "FLAG_FORENSICS_3_JSTEG", lambda p: solve_jsteg(p)),
    ("bitplane.png", "FLAG_FORENSICS_3_BITPLANE", lambda p: solve_bitplane(p)),
    ("whitespace.txt", "FLAG_FORENSICS_3_WHITESPACE", lambda p: solve_whitespace(p)),
    ("appended.zip.png", "FLAG_FORENSICS_3_APPENDZIP", lambda p: solve_appended_zip(p)),
    ("wav_lsb.wav", "FLAG_FORENSICS_3_WAVLSB", lambda p: solve_wav_lsb(p)),
    ("text_chunk.png", "FLAG_FORENSICS_3_PNGTEXT", lambda p: solve_text_chunk(p)),
]

def main():
    print("=== Solving & verifying Forensics 3 artifacts ===\n")
    results = {}
    failed = []
    for filename, flag_key, solver in SOLVERS:
        path = OUT / filename
        if not path.exists():
            failed.append(filename)
            print(f"  FAIL {filename}: artifact missing")
            continue
        try:
            flag = solver(path)
            results[filename] = {"sha256": sha256(path), "flag_key": flag_key}
            print(f"  PASS {filename}: {flag}")
        except Exception as e:
            failed.append(filename)
            print(f"  FAIL {filename}: {e}")

    print(f"\n{len(results)}/{len(SOLVERS)} verified")
    if failed:
        print(f"Failed: {', '.join(failed)}")
        raise SystemExit(1)

    VERIFIED.write_text(json.dumps({"verified": True, "files": results}, indent=2))
    print(f"Wrote {VERIFIED}")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run it — all 10 must PASS**

```bash
python3 scripts/solve-forensics3.py
```

Expected: `PASS` × 10, `10/10 verified`, `Wrote scripts/forensics-artifacts/verified.json`, exit 0.

- [ ] **Step 3: Confirm `verified.json` content**

```bash
cat scripts/forensics-artifacts/verified.json
```

Expected: `{"verified": true, "files": {"appended.zip.png": {"sha256": "...", "flag_key": "FLAG_FORENSICS_3_APPENDZIP"}, ...}}` with all 10 entries.

- [ ] **Step 4: Commit**

```bash
git add scripts/solve-forensics3.py scripts/forensics-artifacts/verified.json
git commit -m "feat: add forensics 3 solver with verified.json gate"
```

---

### Task 4: Create `scripts/seed-forensics3.js` (Cloudinary upload + DB insert)

**Files:**
- Create: `scripts/seed-forensics3.js`

**Interfaces:**
- Consumes: `scripts/forensics-artifacts/verified.json` (Task 3), artifacts (Task 2), `flags.env`, env vars `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Produces: rows in `ctf_challenges` with `file_url` pointing to Cloudinary.
- Behavior: refuses to run without `verified.json`; uploads each file; deletes existing rows by `title` match; skips (with warning) on Cloudinary failure. `--dry-run` prints the plan without touching network.

- [ ] **Step 1: Write the script**

Create `scripts/seed-forensics3.js` with this full content:

```javascript
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

// ============================================================
// Load flags from flags.env
// ============================================================
function loadFlags() {
  const flagsPath = path.resolve(__dirname, '../flags.env')
  const content = fs.readFileSync(flagsPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}
function getFlag(key) {
  const v = process.env[key]
  if (!v) throw new Error('Missing ' + key + ' in flags.env')
  return v
}
loadFlags()

const OUT = path.join(__dirname, 'forensics-artifacts')
const VERIFIED_PATH = path.join(OUT, 'verified.json')

// ============================================================
// Config
// ============================================================
const DRY_RUN = process.argv.includes('--dry-run')
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const API_KEY = process.env.CLOUDINARY_API_KEY
const API_SECRET = process.env.CLOUDINARY_API_SECRET
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN_ID = 'ea020b54-40fd-4c92-9c83-aa1d305a5de0'
const AUTHOR = 'Kleia CTF'

// ============================================================
// Challenges
// ============================================================
const challenges = [
  {
    title: 'XOR Stream', category: 'forensics', difficulty: 'medium', points: 250,
    filename: 'stream_xor.pcap', flagKey: 'FLAG_FORENSICS_3_STREAMXOR',
    description: `This network capture looks harmless, but a flag is hiding in the TCP stream.

Download the .pcap and open it in Wireshark. The HTTP POST body is NOT plaintext — every byte has been XOR'd with a single key byte.

Recover the payload and XOR it back to reveal the flag. Simple grep won't find it.

Hint: Follow the TCP stream, export the payload, then XOR each byte with the same key.`,
    hint: 'Open stream_xor.pcap in Wireshark, Follow TCP Stream. The payload is XOR\'d with a single-byte key (try 0x2A).',
  },
  {
    title: 'Steg Image', category: 'forensics', difficulty: 'easy', points: 125,
    filename: 'steg_image.bmp', flagKey: 'FLAG_FORENSICS_3_STEGIMAGE',
    description: `This BMP image hides a secret with steghide.

Download the image and extract the embedded file. The passphrase is provided below — you won't need to brute-force it.

Hint: steghide extract -sf steg_image.bmp -xf out.txt -p <passphrase>`,
    hint: 'steghide extract -sf steg_image.bmp -xf out.txt -p kleia_rock_2026',
  },
  {
    title: 'Steg Audio', category: 'forensics', difficulty: 'medium', points: 275,
    filename: 'steg_audio.wav', flagKey: 'FLAG_FORENSICS_3_STEGAUDIO',
    description: `Steganography isn't just for images — audio files work too.

This WAV file has a secret embedded with steghide. Extract it with the passphrase.

Hint: steghide extract -sf steg_audio.wav -xf out.txt -p <passphrase>`,
    hint: 'steghide extract -sf steg_audio.wav -xf out.txt -p kleia_audio_2026',
  },
  {
    title: 'Zsteg PNG', category: 'forensics', difficulty: 'easy', points: 100,
    filename: 'zsteg.png', flagKey: 'FLAG_FORENSICS_3_ZSTEG',
    description: `This PNG looks like a solid color, but the pixels tell a different story.

The flag is hidden in the least significant bits of the RGB channels. A stego scanner will find it instantly.

Hint: zsteg -a zsteg.png`,
    hint: 'Run: zsteg -a zsteg.png',
  },
  {
    title: 'Jsteg JPEG', category: 'forensics', difficulty: 'hard', points: 500,
    filename: 'jsteg.jpg', flagKey: 'FLAG_FORENSICS_3_JSTEG',
    description: `JPEG steganography hides data inside the DCT coefficients after compression.

This photo has a message embedded with the jsteg tool. Recover it with the same tool.

Hint: jsteg reveal jsteg.jpg out.txt`,
    hint: 'jsteg reveal jsteg.jpg out.txt',
  },
  {
    title: 'Bit Plane', category: 'forensics', difficulty: 'medium', points: 300,
    filename: 'bitplane.png', flagKey: 'FLAG_FORENSICS_3_BITPLANE',
    description: `An image can hide text in its bit planes — the human eye can't tell, but a tool can.

The flag text is drawn in bit 0 of the red channel. Open the image in a bit-plane viewer (like StegSolve) and look at the red bit-0 plane.

Hint: In StegSolve, walk the bit planes of the red channel. Bit plane 0 shows the flag.`,
    hint: 'StegSolve → Analyse → Bit Plane, select Red plane 0. The flag text is visible there.',
  },
  {
    title: 'Whitespace Stego', category: 'forensics', difficulty: 'medium', points: 225,
    filename: 'whitespace.txt', flagKey: 'FLAG_FORENSICS_3_WHITESPACE',
    description: `Sometimes the secret is right under your nose — in the whitespace.

This text file looks like a normal log, but the trailing whitespace on each line encodes a message: a space is 0, a tab is 1.

Group every 8 bits to get one ASCII character.

Hint: space = 0, tab = 1. Collect the trailing whitespace of each line, group in 8s, decode ASCII.`,
    hint: 'Each line ends with a space (0) or tab (1). Read them in order, group 8 bits, convert to ASCII.',
  },
  {
    title: 'Appended Archive', category: 'forensics', difficulty: 'easy', points: 150,
    filename: 'appended.zip.png', flagKey: 'FLAG_FORENSICS_3_APPENDZIP',
    description: `This PNG image renders perfectly, but something is stitched onto the end of the file.

A ZIP archive has been appended after the PNG data. Find it, extract it, and read the flag.

Hint: binwalk appended.zip.png or search for the PK signature in a hex editor.`,
    hint: 'binwalk appended.zip.png → extract → unzip → read flag.txt.',
  },
  {
    title: 'WAV LSB', category: 'forensics', difficulty: 'medium', points: 250,
    filename: 'wav_lsb.wav', flagKey: 'FLAG_FORENSICS_3_WAVLSB',
    description: `This audio file plays a clean tone, but its samples carry a secret.

The flag is encoded in the least significant bit of each 16-bit audio sample. Extract the LSBs, group them into bytes, and decode.

Hint: Read the PCM samples; take bit 0 of each sample, collect them in order, group by 8, convert to ASCII.`,
    hint: 'Parse the WAV as 16-bit PCM samples. Take the LSB of each sample, group every 8 bits into a byte.',
  },
  {
    title: 'PNG Text Chunk', category: 'forensics', difficulty: 'easy', points: 110,
    filename: 'text_chunk.png', flagKey: 'FLAG_FORENSICS_3_PNGTEXT',
    description: `PNG files are built from chunks. Most chunks hold image data, but some hold text.

This PNG carries a tEXt chunk with a Comment keyword. Read the metadata to find the flag.

Hint: exiftool text_chunk.png and look at the Comment field.`,
    hint: 'exiftool text_chunk.png → Comment field, or read the tEXt chunk in a hex editor.',
  },
]

// ============================================================
// Helpers
// ============================================================
function hashFlag(flag) {
  return crypto.createHash('sha256').update(flag).digest('hex')
}

async function uploadToCloudinary(buffer, filename) {
  const timestamp = Math.round(Date.now() / 1000)
  const paramsToSign = `folder=kleia/ctf/forensics&timestamp=${timestamp}`
  const signature = crypto.createHash('sha1').update(paramsToSign + API_SECRET).digest('hex')
  const formData = new FormData()
  formData.append('file', new Blob([buffer]), filename)
  formData.append('api_key', API_KEY)
  formData.append('timestamp', timestamp.toString())
  formData.append('signature', signature)
  formData.append('folder', 'kleia/ctf/forensics')
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, {
    method: 'POST',
    body: formData,
  })
  const data = await res.json()
  if (!data.secure_url) {
    console.error('Upload failed for ' + filename + ':', JSON.stringify(data))
    return null
  }
  return data.secure_url
}

async function main() {
  console.log('=== Forensics 3 Seeder ===\n')

  // Gate: artifacts must be verified first
  if (!fs.existsSync(VERIFIED_PATH)) {
    console.error('Refusing to seed: scripts/forensics-artifacts/verified.json not found.')
    console.error('Run scripts/solve-forensics3.py first and confirm all 10 PASS.')
    process.exit(1)
  }
  const verified = JSON.parse(fs.readFileSync(VERIFIED_PATH, 'utf-8'))
  if (!verified.verified || Object.keys(verified.files).length !== challenges.length) {
    console.error('Refusing to seed: verified.json is incomplete or not verified.')
    process.exit(1)
  }
  console.log('Gate passed: all artifacts verified.\n')

  if (DRY_RUN) {
    console.log('DRY RUN — no network calls will be made.\n')
    for (const c of challenges) {
      const p = path.join(OUT, c.filename)
      if (!fs.existsSync(p)) { console.error('  MISSING ' + c.filename); process.exit(1) }
      const sha = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
      const v = verified.files[c.filename]
      if (!v || v.sha256 !== sha) {
        console.error('  SHA MISMATCH ' + c.filename + ' — regenerate with gen-forensics3.py'); process.exit(1)
      }
      console.log(`  [dry] ${c.title} (${c.difficulty}, ${c.points}pts) → ${c.filename}`)
    }
    console.log('\nDry run OK. Re-run without --dry-run to seed for real.')
    process.exit(0)
  }

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    console.error('Missing Cloudinary env vars'); process.exit(1)
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing Supabase env vars'); process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let ok = 0
  for (const c of challenges) {
    console.log(`\n--- ${c.title} ---`)
    const filePath = path.join(OUT, c.filename)
    const buffer = fs.readFileSync(filePath)
    const sha = crypto.createHash('sha256').update(buffer).digest('hex')
    const v = verified.files[c.filename]
    if (!v || v.sha256 !== sha) {
      console.error(`  SHA mismatch on ${c.filename} — skip`)
      continue
    }

    // Delete existing rows with the same title (avoid nuking other forensics)
    const { error: delErr } = await supabase.from('ctf_challenges').delete().eq('title', c.title)
    if (delErr) console.error('  Delete warning:', delErr.message)

    const fileUrl = await uploadToCloudinary(buffer, c.filename)
    if (!fileUrl) { console.error(`  FAILED upload ${c.filename} — skipping`); continue }

    const { error } = await supabase.from('ctf_challenges').insert({
      title: c.title,
      description: c.description,
      category: c.category,
      difficulty: c.difficulty,
      points: c.points,
      flag_hash: hashFlag(getFlag(c.flagKey)),
      hint: c.hint,
      file_url: fileUrl,
      status: 'approved',
      created_by: ADMIN_ID,
      author: AUTHOR,
    })
    if (error) { console.error(`  DB error: ${error.message}`) }
    else { console.log(`  OK ${c.title} (${c.difficulty}, ${c.points}pts)`) ; ok++ }
  }

  console.log(`\n=== Done! ${ok}/${challenges.length} forensics 3 challenges seeded ===`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Dry-run to confirm the gate + hashes**

```bash
node scripts/seed-forensics3.js --dry-run
```

Expected: `Gate passed`, then `[dry] <title> ... → <filename>` for all 10, then `Dry run OK`.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-forensics3.js
git commit -m "feat: add forensics 3 seeder with verified.json gate"
```

---

### Task 5: End-to-end real run (generate fresh → solve → seed)

**Files:** none new.

- [ ] **Step 1: Regenerate artifacts from scratch (fresh flags path)**

```bash
python3 scripts/gen-forensics3.py && python3 scripts/solve-forensics3.py
```

Expected: 10 `OK` lines, then 10 `PASS` lines, `10/10 verified`, exit 0.

- [ ] **Step 2: Confirm the non-grepable pcap requirement holds**

```bash
strings scripts/forensics-artifacts/stream_xor.pcap | grep -c KLEIA
```

Expected: `0` (flag is XOR'd, plaintext `strings` finds nothing). Also confirm the solver path works:

```bash
python3 - <<'EOF'
import sys; sys.path.insert(0, 'scripts')
from solve_forensics3 import solve_stream_xor, OUT
print(solve_stream_xor(OUT / 'stream_xor.pcap'))
EOF
```

Expected: prints the flag.

- [ ] **Step 3: Confirm steghide/zsteg/jsteg solve without DB**

```bash
steghide extract -sf scripts/forensics-artifacts/steg_image.bmp -xf /tmp/s.txt -p kleia_rock_2026 -f >/dev/null 2>&1 && cat /tmp/s.txt
zsteg -a scripts/forensics-artifacts/zsteg.png 2>/dev/null | grep KLEIA
~/go/bin/jsteg reveal scripts/forensics-artifacts/jsteg.jpg /tmp/j.txt >/dev/null 2>&1 && cat /tmp/j.txt
```

Expected: the image flag, zsteg output containing the flag, and the jsteg flag.

- [ ] **Step 4: Real seed (requires env vars loaded)**

```bash
source .env.local 2>/dev/null || true
node scripts/seed-forensics3.js
```

Expected: `Gate passed`, then `OK <title>` for each of the 10, final `=== Done! 10/10 ... ===`. (If env vars are absent, the script exits with a clear message — run from a shell with `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` set.)

- [ ] **Step 5: Verify rows landed with file_url + hashed flags**

```bash
node - <<'EOF'
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
;(async () => {
  const { data, error } = await sb.from('ctf_challenges')
    .select('title, category, difficulty, points, file_url, flag_hash')
    .in('title', ['XOR Stream','Steg Image','Steg Audio','Zsteg PNG','Jsteg JPEG','Bit Plane','Whitespace Stego','Appended Archive','WAV LSB','PNG Text Chunk'])
  if (error) throw error
  data.forEach(r => console.log(`${r.title} | ${r.difficulty} ${r.points} | ${r.file_url} | ${r.flag_hash.slice(0,12)}...`))
  console.log('rows:', data.length)
})()
EOF
```

Expected: 10 rows, each with a Cloudinary `file_url` and a non-empty `flag_hash`.

- [ ] **Step 6: Commit any fixups**

If a fixup was needed during the real run, commit it:

```bash
git add -A
git commit -m "fix: forensics 3 seeding adjustments"
```

If nothing changed, verify `git status` shows only untracked artifacts and `flags.env` (never committed):

```bash
git status --short
```

Expected: `scripts/forensics-artifacts/` artifacts untracked (they may already be tracked from batch 1 — if so, they'll show as modified), `flags.env` untracked/ignored.

---

## Self-Review Notes

- **Spec coverage:** All 10 challenges from the spec are present (XOR pcap C1, steghide BMP C2, steghide WAV C3, zsteg C4, jsteg C5, bit-plane C6, whitespace C7, appended ZIP C8, WAV LSB C9, PNG tEXt C10). Verify-first gate, Cloudinary raw upload, `file_url` insert, delete-by-title, `--dry-run`, and hints all implemented. Points match the 100–600 scale.
- **Dependencies confirmed locally:** steghide 0.5.1 (BMP+WAV verified), zsteg 0.2.14 (verified on LSB PNG), jsteg at `~/go/bin/jsteg` (verified hide+reveal), binwalk not required by solver (ZIP signature parse verified), PIL 12.2.0.
- **Type consistency:** `get_flag`/`getFlag` naming matches existing scripts; `verified.json` schema shared between solve script and seeder uses identical keys (`sha256`, `flag_key`). Passphrases `kleia_rock_2026` / `kleia_audio_2026` and flag keys `FLAG_FORENSICS_3_*` are consistent across Tasks 2–4.
- **Known constraint:** steghide does not support PNG covers — BMP and WAV are used. `GLYPH5X7` supports only the characters used in the bit-plane flag (`KLEIA{b1tpl4n3_0f_th3_r3d_ch4nn3l}`); unknown chars are skipped by design in the generator and stop the decoder — the flag contains only supported glyphs. **Correction (review):** `n`/`r` and `c`/`{` glyphs were made distinct (`r` = `110,101,100,100,100`, `n` = `110,101,101,101,101`, `c` = `011,101,101,101,011`), and the solver's bit-plane extraction polarity was fixed so dark pixels (bit 0 == 0) map to glyph `"1"` (matching how the generator clears bit 0). Verified: regenerated `bitplane.png` decodes exactly to the flag.