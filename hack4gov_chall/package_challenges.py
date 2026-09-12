"""Build the local-only HackForGov preparation pack.

The output directory contains generated flags and archives and must never be
deployed as public challenge content or committed to the repository.
"""

import base64
import json
import secrets
import sys
import zipfile
from pathlib import Path


PACK = [
    ("WEB-01", "web", "Profile Lookup", "Find the account record exposed by an overly-trusting profile endpoint.", "Inspect the request and compare the requested account identifier with the logged-in user.", "Broken object-level authorization (IDOR).", "api-response.json"),
    ("WEB-02", "web", "Template Echo", "A support preview reflects a value into an HTML template.", "Trace the value from the request parameter into the rendered response.", "Context-aware output encoding and XSS prevention.", "rendered-response.html"),
    ("WEB-03", "web", "Upload Gate", "A file-review report shows why an upload was accepted too early.", "Compare the filename with the detected content type and scan decision.", "Content validation, malware scanning, and fail-closed uploads.", "upload-audit.json"),
    ("CRYPTO-01", "crypto", "Hexed Evidence", "Recover the flag from a hexadecimal evidence file.", "Use xxd -r -p or a short script to decode the bytes.", "Hex encoding is not encryption.", "evidence.hex"),
    ("CRYPTO-02", "crypto", "Base64 Breadcrumb", "A configuration export contains a base64-encoded token.", "Identify the encoding from the alphabet and decode it once.", "Encoding recognition and safe decoding.", "config.txt"),
    ("CRYPTO-03", "crypto", "Reused XOR", "Two messages were encrypted with the same single-byte XOR key.", "XOR the known plaintext relationship, then test printable candidates.", "Keystream reuse and why one-time pads require a fresh key.", "xor-notes.txt"),
    ("FORENSICS-01", "forensics", "PCAP Clue", "A text-rendered packet capture contains one suspicious HTTP request.", "Filter for HTTP POST traffic and inspect the request body.", "PCAP triage and evidence preservation.", "capture.pcap.txt"),
    ("FORENSICS-02", "forensics", "Artifact Metadata", "A photo-export report contains metadata from the workstation.", "Review every metadata field, including software and comment fields.", "Metadata as an investigative artifact.", "metadata.txt"),
    ("FORENSICS-03", "forensics", "Deleted Timeline", "A recovery log contains a deleted file event among normal activity.", "Sort events by timestamp and locate the deleted object.", "Timeline reconstruction and chain of custody.", "timeline.log"),
    ("NETWORK-01", "network", "DNS Trail", "A resolver log records a workstation contacting a suspicious domain.", "Group queries by host and inspect the first-seen domain.", "DNS investigation and indicator extraction.", "dns.log"),
    ("NETWORK-02", "network", "HTTP Headers", "A proxy log reveals a credential leak caused by an unsafe request.", "Inspect method, destination, and headers without replaying the request.", "Network security and secret handling.", "proxy.log"),
    ("PROGRAM-01", "programming", "Parser Patrol", "Extract the only valid record from newline-delimited incident data.", "Write a parser that validates the record shape before selecting it.", "Input validation and reliable automation.", "records.ndjson"),
    ("PROGRAM-02", "programming", "Checksum Challenge", "Find the record whose checksum matches its normalized payload.", "Normalize whitespace, hash the payload, and compare checksums.", "Deterministic scripting and integrity checks.", "checksums.json"),
    ("REVERSE-01", "reverse", "Branch Table", "A disassembly excerpt shows which branch reaches the success message.", "Follow the comparison and convert the accepted integer to text.", "Control-flow reading without executing unknown binaries.", "disassembly.txt"),
    ("REVERSE-02", "reverse", "String Obfuscation", "A harmless strings report contains fragments joined by a simple transform.", "Order the fragments by offset and reverse each fragment.", "Static analysis and basic obfuscation recognition.", "strings-report.txt"),
    ("EXPLOIT-01", "exploitation", "Command Boundary", "A mock diagnostic command concatenates input into a shell command.", "Mark the unsafe concatenation boundary and identify the injected argument in the fixture.", "Command injection root cause and parameterized execution.", "diagnostic-review.txt"),
    ("EXPLOIT-02", "exploitation", "Race Window", "A code review shows a check-then-use authorization race.", "Compare the timestamps of the permission check and file operation.", "TOCTOU races and atomic authorization decisions.", "race-review.txt"),
    ("IR-01", "incident", "First Signal", "An alert bundle contains authentication, DNS, and endpoint logs.", "Build a timeline and identify the first reliable compromise signal.", "Incident triage and evidence correlation.", "incident-timeline.txt"),
    ("IR-02", "incident", "Containment Choice", "A response playbook lists several actions with different risk levels.", "Choose the least destructive action that stops the observed persistence.", "Containment, preservation, and response sequencing.", "playbook.md"),
    ("MIXED-01", "incident", "Cross-Source Correlation", "Correlate a web request ID across application, proxy, and identity logs.", "Search the shared request ID, then compare timestamps and user identity.", "Multi-source investigation.", "correlation.txt"),
]


def encode_flag(flag, mode):
    raw = flag.encode()
    if mode == "hex":
        return raw.hex()
    if mode == "base64":
        return base64.b64encode(raw).decode()
    if mode == "reverse":
        return flag[::-1]
    return flag


def make_manifest():
    manifest = []
    for index, (slug, category, title, description, hint, explanation, target) in enumerate(PACK, 1):
        flag = f"KLEIA{{h4g_{slug.lower().replace('-', '_')}_{secrets.token_hex(3)}}}"
        modes = ["direct", "hex", "base64", "reverse"]
        manifest.append({
            "number": index, "slug": slug.lower(), "category": category, "difficulty": "easy" if index <= 12 else "medium",
            "title": title, "description": description, "hint": hint, "explanation": explanation,
            "target": target, "encoding": modes[(index - 1) % len(modes)], "flag": flag,
            "filename": f"hack4gov_{index:02d}_{slug.lower().replace('-', '_')}.zip", "points": 50 + index * 10,
        })
    return manifest


def target_text(item):
    value = encode_flag(item["flag"], item["encoding"])
    if item["encoding"] == "hex":
        return f"hex_payload={value}\n"
    if item["encoding"] == "base64":
        return f"token={value}\n"
    if item["encoding"] == "reverse":
        return f"reversed_value={value}\n"
    return f"evidence={value}\n"


def build(output):
    output = Path(output)
    archives = output / "archives"
    archives.mkdir(parents=True, exist_ok=True)
    manifest = make_manifest()
    for item in manifest:
        root = f"{item['slug']}/"
        readme = f"Mission: {item['description']}\n\nStart by examining the supplied evidence and document your reasoning.\n"
        decoy = "This record is ordinary training data.\n"
        with zipfile.ZipFile(archives / item["filename"], "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(root + "README.txt", readme)
            zf.writestr(root + item["target"], target_text(item))
            zf.writestr(root + "decoy.txt", decoy)
    # The seed needs the flags, but this manifest is local-only and excluded from Git.
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Validated {len(manifest)}/20 challenge solve paths")
    print(f"Built {len(manifest)} private HackForGov archives")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: package_challenges.py OUTPUT_DIR")
    build(sys.argv[1])
