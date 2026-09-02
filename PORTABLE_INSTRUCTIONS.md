# Portable LAN File Transfer - Ready-to-Use Edition

This application is built to run on any computer with **zero installation**, using **Portable Node.js**.

---

## ⚡ How to Run with Portable Node.js

### Windows
1. Copy your portable `node.exe` into the application folder (next to `start.bat`), or into a `bin/` or `nodejs/` subfolder.
2. Double-click **`start.bat`**.
3. Your default browser will launch automatically at `http://localhost:3000`.

### Linux / macOS
1. Place your portable `node` executable in the application root directory (or in `bin/node`).
2. Make both executable:
   ```bash
   chmod +x start.sh node
   ```
3. Run:
   ```bash
   ./start.sh
   ```

---

## 🤖 GitHub Actions Automated Compiler

Every time you push code or trigger a workflow in your GitHub repository:
1. **GitHub Actions** runs `.github/workflows/build-portable-release.yml`.
2. It compiles the React client and standalone backend server (`dist/server.cjs`).
3. It bundles all static assets, launchers (`start.bat`, `start.sh`), and configs into a downloadable `portable-lan-transfer-ready-to-run.zip`.
4. You can download the pre-compiled zip from the **Actions** tab (under "Artifacts") or the **Releases** page without compiling anything on your PC!

---

## 📁 Package Contents

| File / Folder | Purpose |
| :--- | :--- |
| `start.bat` | Windows launcher (auto-detects `node.exe`, opens browser, starts server) |
| `start.sh` | Linux/macOS launcher |
| `dist/server.cjs` | Self-contained server bundle (no `node_modules` required) |
| `dist/index.html` | Client web interface |
| `dist/assets/` | Bundled React components, Tailwind styles, and icons |
| `uploads/` | Local directory for uploaded files and notes |
| `README_PORTABLE.txt` | Quick start cheat sheet |

---

## 🔒 Network Privacy
- All transfers happen **strictly over your direct Local Area Network (LAN) / Wi-Fi**.
- No data is sent to external clouds or servers.
- Files remain stored on the host computer running the portable server.
