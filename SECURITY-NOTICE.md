# Security incident note (2026-11-17)

The original public version embedded a Spoonacular API key in browser JavaScript. The current application stores the new key only in a gitignored server environment file and serves requests through a local backend.

**Revoke the previously exposed Spoonacular key immediately** in the provider dashboard. Removing it from the latest code and CI does **not** delete it from Git history, clones, browser caches, or forks.

The bundled `scripts/check_secrets.py` checks the current tracked tree for high-confidence token patterns, but it does not audit historical Git objects or guarantee every secret is discovered. Do not deploy the local-only proxy publicly without a hardened server, usage quotas, rate limiting, and abuse protection.
