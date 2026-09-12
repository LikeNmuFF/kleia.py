from pathlib import Path


def test_seed_is_private_only():
    source = Path(__file__).with_name("seed_private_lab.mjs").read_text()
    assert "const LAB_TITLE = 'Cl4ud3x_'" in source
    assert "from('practice_challenges')" in source
    assert "scope_room_id: room.id" in source
    assert "from('ctf_challenges')" not in source
    assert "practice_publications" not in source
    assert "ctf_season_challenges" not in source


def test_seed_refuses_partial_sets_and_requires_explicit_apply():
    source = Path(__file__).with_name("seed_private_lab.mjs").read_text()
    assert "if (!apply)" in source
    assert "refusing to create duplicates" in source
    assert "Expected exactly one private lab named" in source
