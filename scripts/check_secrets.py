#!/usr/bin/env python3
"""High-confidence credential gate; never prints a detected secret or filename."""
from pathlib import Path
import re
import subprocess
import sys

PATTERNS = (
    re.compile(rb"sk_live_[A-Za-z0-9]{16,}"),
    re.compile(rb"sk-(?:proj|svcacct)-[A-Za-z0-9_-]{18,}"),
    re.compile(rb"(?:ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9]{30,}"),
    re.compile(rb"github_pat_[A-Za-z0-9_]{50,}"),
    re.compile(rb"AKIA[0-9A-Z]{16}"),
    re.compile(rb"AIza[A-Za-z0-9_-]{30,}"),
    re.compile(rb"xox[baprs]-[A-Za-z0-9-]{20,}"),
    re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(rb"sk-ant-[A-Za-z0-9_-]{18,}"),
)

def tracked_files():
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        check=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
    )
    return [Path(p.decode("utf-8", "surrogateescape")) for p in result.stdout.split(b"\0") if p]

def main():
    count = 0
    inspected = 0
    root = Path.cwd()
    for path in tracked_files():
        try:
            if not path.is_file() or path.is_symlink() or path.stat().st_size > 8_000_000:
                continue
            # Check paths as well as file bytes without logging either.
            raw_path = str(path).encode("utf-8", "surrogateescape")
            data = path.read_bytes()
            inspected += 1
            if any(pattern.search(raw_path) or pattern.search(data) for pattern in PATTERNS):
                count += 1
        except (OSError, ValueError):
            continue
    if count:
        print(f"FAIL: High-confidence credential signatures detected in {count} tracked files. Values and paths withheld.")
        return 1
    print(f"PASS: {inspected} currently tracked files checked for high-confidence credential signatures.")
    print("This does not scan Git history or prove every password is safe; provider rotation remains mandatory.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
