
## Windows 11: verified launch method, one command at a time

This repository's main UI is a **static website**. You do not need `pip install`, a virtual environment, or an npm build to serve it. Install Git and Python 3, then run:

```powershell
git clone https://github.com/Tyler-Keesee/Recipe-Master.git
```

```powershell
Set-Location .\Recipe-Master
```

```powershell
python -m http.server 8000
```

Open **http://localhost:8000/** in Edge or Chrome while the server runs; press **Ctrl+C** to stop it.

**Important:** Security concern: the existing client-side JavaScript contains a hard-coded API key. Treat that key as exposed and revoke/rotate it at the API provider before further use. A public static frontend cannot safely hold a private API credential. Search may fail without a properly secured backend.

**Scope of verification:** Serving files is not equivalent to testing every feature, external API, or storage operation. Open Developer Tools (F12) if a feature fails.

---

# Recipe-Master