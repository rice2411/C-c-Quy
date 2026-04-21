#!/usr/bin/env python3
"""Scan a page folder for className= on common UI components; report file and line.

Resolves short names like "Login" -> pages/Login (same convention as scan_html_tag.py).
Optional: flag lines where className mixes several semantic groups (likely should use *ClassName props).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import List, Set, Tuple

SUPPORTED_EXTENSIONS = {".tsx", ".jsx"}
MAPPING_FILE = "ui_tag_mapping.json"

# Tailwind-ish tokens: multiple groups on one className -> suggest param split
_SEMANTIC_GROUPS = (
    (r"(?:^|\s)(?:hover:|focus:|active:)", "state_interaction"),
    (r"(?:^|\s)bg-(?:\[|(?:inherit|current|transparent)|gradient-)", "background"),
    (r"(?:^|\s)(?:text-|font-|leading-|tracking-)", "text_typography"),
    (r"(?:^|\s)(?:border|ring|outline)(?:-|$)", "border_ring"),
    (r"(?:^|\s)rounded(?:-|$)", "rounded"),
    (r"(?:^|\s)shadow(?:-|$)", "shadow"),
    (r"(?:^|\s)(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr)-", "spacing"),
    (r"(?:^|\s)(?:flex|grid|inline-flex|block|hidden)\b", "layout_display"),
    (r"(?:^|\s)(?:w-|h-|min-w|max-w|min-h|max-h)", "sizing"),
)


def _repo_root(script_path: Path) -> Path:
    return script_path.resolve().parent.parent


def _load_common_names(repo_root: Path) -> Set[str]:
    path = repo_root / "scripts" / MAPPING_FILE
    raw = json.loads(path.read_text(encoding="utf-8"))
    names: Set[str] = set(raw.get("common_components", {}).values())
    names.update(raw.get("raw_to_common", {}).values())
    return names


def _resolve_target_path(raw_path: str, repo_root: Path) -> Path:
    normalized = raw_path.strip().strip("\"'").replace("\\", "/")
    if normalized.startswith("/"):
        normalized = normalized[1:]

    if "/" not in normalized and "\\" not in raw_path:
        candidate = repo_root / "pages" / normalized
        if candidate.exists():
            return candidate

    p = Path(normalized)
    return p if p.is_absolute() else (repo_root / p)


def _iter_source_files(target: Path) -> List[Path]:
    if not target.exists():
        return []
    if target.is_file():
        return [target] if target.suffix.lower() in SUPPORTED_EXTENSIONS else []
    return sorted(p for p in target.rglob("*") if p.suffix.lower() in SUPPORTED_EXTENSIONS)


def _extract_string_literal_after_classname(line: str) -> str | None:
    """Return content inside className="..." or className='...' on this line (no multiline)."""
    m = re.search(r"className\s*=\s*([\"'])(.*?)\1", line)
    if m:
        return m.group(2)
    if "className={`" in line or "className={`" in line.replace(" ", ""):
        return None
    m2 = re.search(r"className\s*=\s*\{\s*[\"']([^\"']*)[\"']\s*\}", line)
    if m2:
        return m2.group(1)
    return None


def _semantic_group_count(class_blob: str) -> int:
    if not class_blob or not class_blob.strip():
        return 0
    groups = set()
    for pattern, label in _SEMANTIC_GROUPS:
        if re.search(pattern, class_blob):
            groups.add(label)
    return len(groups)


_JSX_OPEN = re.compile(r"<\s*(?:[\w$]+\.)*([A-Z][A-Za-z0-9]*)\b")


def _component_before_classname(line: str) -> str | None:
    pos = line.find("className")
    if pos == -1:
        return None
    prefix = line[:pos]
    matches = list(_JSX_OPEN.finditer(prefix))
    if not matches:
        return None
    return matches[-1].group(1)


def _find_nearest_opening_component(lines: List[str], idx: int, common: Set[str], max_lookback: int) -> str | None:
    same = _component_before_classname(lines[idx])
    if same:
        return same if same in common else None
    for j in range(idx - 1, max(-1, idx - max_lookback - 1), -1):
        row = lines[j]
        last_common: str | None = None
        for m in re.finditer(r"<\s*([A-Z][A-Za-z0-9]*)\b", row):
            name = m.group(1)
            if name in common:
                last_common = name
        if last_common:
            return last_common
    return None


def scan_file(path: Path, common: Set[str]) -> List[Tuple[int, str, str, bool]]:
    """Lines: (line_no, component_name, stripped_line, suggest_split)."""
    text = path.read_text(encoding="utf-8", errors="ignore")
    lines = text.splitlines()
    out: List[Tuple[int, str, str, bool]] = []
    for i, line in enumerate(lines, start=1):
        if re.search(r"\bclassName\s*=", line) is None:
            continue
        comp = _find_nearest_opening_component(lines, i - 1, common, max_lookback=30)
        if not comp:
            continue
        literal = _extract_string_literal_after_classname(line)
        suggest = literal is not None and _semantic_group_count(literal) >= 2
        out.append((i, comp, line.strip(), suggest))
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="Scan page TSX/JSX for className= on common UI.")
    parser.add_argument("page", help='Page path or short name, e.g. Login or pages/Dashboard')
    parser.add_argument(
        "--split-only",
        action="store_true",
        help="Only report className string literals that hit 2+ semantic groups (likely use *ClassName props)",
    )
    args = parser.parse_args()

    root = _repo_root(Path(__file__))
    common = _load_common_names(root)
    target = _resolve_target_path(args.page, root)
    files = _iter_source_files(target)

    if not files:
        print(f"No TSX/JSX files under: {target}", file=sys.stderr)
        return 1

    total = 0
    for fp in files:
        hits = scan_file(fp, common)
        if args.split_only:
            hits = [h for h in hits if h[3]]
        for line_no, comp, snippet, _ in hits:
            rel = fp.relative_to(root)
            print(f"{rel}:{line_no}\t{comp}\t{snippet}")
            total += 1

    if total == 0:
        print("all pass")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
