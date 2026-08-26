#!/usr/bin/env python3
"""Validate the checked-in SILELO skill suite without external project state."""

from __future__ import annotations

import re
import sys
from pathlib import Path

REQUIRED_PACKAGES = {
    "silelo-ai-studio-workflow",
    "silelo-api-gateway",
    "silelo-chat-acceptance",
    "silelo-media-studio",
    "silelo-chat-ui-refinement",
}
MAX_SKILL_LINES = 500
SECRET_PATTERNS = (
    re.compile(r"sk-[A-Za-z0-9]{20,}"),
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"(?i)\b(?:openrouter|anthropic|google|github)_api_key\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{16,}"),
)


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def read_frontmatter(path: Path) -> tuple[str, str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        fail(f"{path}: missing YAML frontmatter opener")
    try:
        end = next(index for index, line in enumerate(lines[1:], start=1) if line.strip() == "---")
    except StopIteration:
        fail(f"{path}: missing YAML frontmatter closer")

    fields: dict[str, str] = {}
    for line in lines[1:end]:
        key, separator, value = line.partition(":")
        if separator:
            fields[key.strip()] = value.strip()
    name = fields.get("name", "")
    description = fields.get("description", "")
    if not name or not description or "TODO" in description:
        fail(f"{path}: frontmatter must contain non-placeholder name and description")
    return name, description


def main() -> None:
    root = Path(__file__).resolve().parents[1] / "skills"
    if not root.is_dir():
        fail("skills/ directory is missing")

    skill_files = sorted(root.glob("*/SKILL.md"))
    found_packages = {path.parent.name for path in skill_files}
    missing = REQUIRED_PACKAGES - found_packages
    if missing:
        fail(f"missing required package(s): {', '.join(sorted(missing))}")

    names: dict[str, Path] = {}
    for skill_file in skill_files:
        package = skill_file.parent.name
        line_count = len(skill_file.read_text(encoding="utf-8").splitlines())
        if line_count >= MAX_SKILL_LINES:
            fail(f"{skill_file}: {line_count} lines exceeds the {MAX_SKILL_LINES - 1}-line limit")
        name, _ = read_frontmatter(skill_file)
        if name != package:
            fail(f"{skill_file}: frontmatter name '{name}' does not match directory '{package}'")
        if name in names:
            fail(f"duplicate skill name '{name}' in {names[name]} and {skill_file}")
        names[name] = skill_file

    text_files = [path for path in root.rglob("*") if path.is_file() and path.stat().st_size < 2_000_000]
    for path in text_files:
        text = path.read_text(encoding="utf-8", errors="replace")
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                fail(f"possible secret pattern found in {path}")

    print(f"Validated {len(skill_files)} SILELO skill package(s): {', '.join(sorted(names))}")
    print("Checked frontmatter, unique names, line limits, required packages, and secret patterns.")


if __name__ == "__main__":
    main()
