import json
import base64
import subprocess
import sys
import zipfile
from pathlib import Path


ROOT = Path(__file__).parent
SCRIPT = ROOT / "package_challenges.py"


def test_pack_generates_twenty_safe_challenges_and_manifest(tmp_path):
    result = subprocess.run([sys.executable, str(SCRIPT), str(tmp_path)], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr

    manifest = json.loads((tmp_path / "manifest.json").read_text())
    assert len(manifest) == 20
    assert {item["category"] for item in manifest} == {
        "web", "crypto", "forensics", "network", "programming", "reverse", "exploitation", "incident",
    }

    for item in manifest:
        archive = tmp_path / "archives" / item["filename"]
        assert archive.exists()
        with zipfile.ZipFile(archive) as zf:
            names = zf.namelist()
            assert len(names) >= 2
            assert all(not name.startswith("/") and ".." not in Path(name).parts for name in names)
            payload = zf.read(f'{item["slug"]}/{item["target"]}').decode()
            value = payload.split('=', 1)[1].strip()
            if item["encoding"] == "hex":
                value = bytes.fromhex(value).decode()
            elif item["encoding"] == "base64":
                value = base64.b64decode(value).decode()
            elif item["encoding"] == "reverse":
                value = value[::-1]
            assert value == item["flag"]


def test_pack_solver_validates_each_challenge(tmp_path):
    result = subprocess.run([sys.executable, str(SCRIPT), str(tmp_path)], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    assert "Validated 20/20 challenge solve paths" in result.stdout
