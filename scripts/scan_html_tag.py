#!/usr/bin/env python3
"""Scan a page path for raw HTML tags that should use common UI components."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple

SUPPORTED_EXTENSIONS = {".tsx", ".jsx"}
MAPPING_FILE_NAME = "ui_tag_mapping.json"


def load_mapping_config(
    repo_root: Path,
) -> Tuple[Dict[str, re.Pattern[str]], Dict[str, re.Pattern[str]], Dict[str, re.Pattern[str]], Dict[str, str]]:
    mapping_path = repo_root / "scripts" / MAPPING_FILE_NAME
    if not mapping_path.exists():
        raise FileNotFoundError(f"Mapping file not found: {mapping_path}")

    raw = json.loads(mapping_path.read_text(encoding="utf-8"))
    raw_tags = raw.get("raw_tags", [])
    raw_input_types = raw.get("raw_input_types", [])
    raw_to_common = raw.get("raw_to_common", {})
    common_components = raw.get("common_components", {})

    tag_patterns = {tag: re.compile(rf"<\s*{re.escape(tag)}\b") for tag in raw_tags}
    input_type_patterns = {
        f"{input_type}_input": re.compile(
            rf"<\s*input\b[^>]*\btype\s*=\s*['\"]{re.escape(input_type)}['\"]"
        )
        for input_type in raw_input_types
    }
    all_common_component_names = set(common_components.values()) | set(raw_to_common.values())
    common_component_patterns = {
        component_name: re.compile(rf"<\s*{re.escape(component_name)}\b")
        for component_name in sorted(all_common_component_names)
    }
    return tag_patterns, input_type_patterns, common_component_patterns, raw_to_common


def resolve_target_path(raw_path: str, repo_root: Path) -> Path:
    normalized = raw_path.strip().strip("\"'").replace("\\", "/")
    if normalized.startswith("/"):
        normalized = normalized[1:]

    if "/" not in normalized and "\\" not in raw_path:
        default_pages_candidate = repo_root / "pages" / normalized
        if default_pages_candidate.exists():
            return default_pages_candidate

    candidate = Path(normalized)
    return candidate if candidate.is_absolute() else (repo_root / candidate)


def iter_source_files(target_path: Path) -> List[Path]:
    if not target_path.exists():
        return []
    if target_path.is_file():
        return [target_path] if target_path.suffix.lower() in SUPPORTED_EXTENSIONS else []
    return [path for path in target_path.rglob("*") if path.suffix.lower() in SUPPORTED_EXTENSIONS]


def find_line_matches(file_content: str, pattern: re.Pattern[str]) -> List[Tuple[int, str]]:
    results: List[Tuple[int, str]] = []
    for line_index, line in enumerate(file_content.splitlines(), start=1):
        if pattern.search(line):
            results.append((line_index, line.strip()))
    return results


def scan_file(
    file_path: Path,
    tag_patterns: Dict[str, re.Pattern[str]],
    input_type_patterns: Dict[str, re.Pattern[str]],
    common_component_patterns: Dict[str, re.Pattern[str]],
) -> Dict[str, List[Tuple[int, str]]]:
    content = file_path.read_text(encoding="utf-8", errors="ignore")
    findings: Dict[str, List[Tuple[int, str]]] = {}
    for name, pattern in tag_patterns.items():
        matches = find_line_matches(content, pattern)
        if matches:
            findings[name] = matches
    for name, pattern in input_type_patterns.items():
        matches = find_line_matches(content, pattern)
        if matches:
            findings[name] = matches
    for name, pattern in common_component_patterns.items():
        matches = find_line_matches(content, pattern)
        if matches:
            findings[f"common_{name}"] = matches
    return findings


def print_report(
    scan_results: Dict[Path, Dict[str, List[Tuple[int, str]]]],
    tag_patterns: Dict[str, re.Pattern[str]],
    input_type_patterns: Dict[str, re.Pattern[str]],
) -> int:
    raw_tag_names = list(tag_patterns.keys())
    input_keys = list(input_type_patterns.keys())
    match_counts: Dict[str, int] = {tag_name: 0 for tag_name in raw_tag_names}
    input_counts: Dict[str, int] = {key: 0 for key in input_keys}

    for file_findings in scan_results.values():
        for tag_name, lines in file_findings.items():
            if tag_name.startswith("common_"):
                continue
            if tag_name in match_counts:
                match_counts[tag_name] += len(lines)
            elif tag_name in input_counts:
                input_counts[tag_name] += len(lines)

    present_raw_tags = [tag_name for tag_name, count in match_counts.items() if count > 0]
    present_input_tags = [key.replace("_input", "") for key, count in input_counts.items() if count > 0]
    fail_tags = sorted(set(present_raw_tags + present_input_tags))

    if not fail_tags:
        print("all pass")
        return 0

    fail_text = ", ".join(fail_tags)
    print(f"Fail: {fail_text} not applied")
    return 1


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scan a page path for raw HTML tags that should be replaced by common UI components."
    )
    parser.add_argument(
        "page_path",
        help="Page path or file path, for example: pages/Login or pages/Login/index.tsx",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    tag_patterns, input_type_patterns, common_component_patterns, _ = load_mapping_config(repo_root)
    target_path = resolve_target_path(args.page_path, repo_root)
    source_files = iter_source_files(target_path)

    if not source_files:
        print(f"No supported source files found for: {target_path}")
        return 2

    scan_results: Dict[Path, Dict[str, List[Tuple[int, str]]]] = {}
    for file_path in source_files:
        file_findings = scan_file(file_path, tag_patterns, input_type_patterns, common_component_patterns)
        if file_findings:
            scan_results[file_path] = file_findings

    return print_report(scan_results, tag_patterns, input_type_patterns)


if __name__ == "__main__":
    sys.exit(main())
