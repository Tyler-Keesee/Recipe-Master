# Recipe Master

A recipe discovery browser app with a **local Express backend proxy**. The browser must never contain the Spoonacular API key.

## Security notice

An old Spoonacular API key was previously committed to public `main.js`. **Revoke that key in Spoonacular before using this app**. Removing it from current code does not remove it from historical commits, third-party forks, or cached browser assets.

## Windows 11: clone and run, one PowerShell command per step

Install Git and Node.js 22 LTS, then run each command individually:

```powershell
git clone https://github.com/Tyler-Keesee/Recipe-Master.git
```

```powershell
Set-Location .\Recipe-Master
```

```powershell
node --version
```

```powershell
npm --version
```

```powershell
npm ci
```

```powershell
Copy-Item .env.example .env
```

```powershell
notepad .env
```

Set `SPOONACULAR_API_KEY` to a **newly issued** key from the Spoonacular dashboard. Never commit the `.env` file.

```powershell
npm test
```

```powershell
npm start
```

Open **http://127.0.0.1:3000/** in Edge or Chrome; stop with Ctrl+C. Unlike the older version, starting a static `python -m http.server` is **not sufficient** for API-backed recipe search: a backend is needed so the key is never sent to the browser.

## Troubleshooting and deployment

- The server listens on `127.0.0.1` only. Do **not** expose this demo directly to the public internet or copy a live API key into browser code.
- `503` means the server has no API key; `429` means local request limit; `502` means the provider request failed.
- `npm test` mocks the provider. Live recipe results require a valid new key, internet access, and sufficient Spoonacular quota.
- For a public deployment, add a production backend with authenticated/rate-limited access, quotas and monitoring. GitHub Pages alone cannot securely store a private API key.

## Updating an existing clone

```powershell
git pull --ff-only
```

```powershell
npm ci
```

