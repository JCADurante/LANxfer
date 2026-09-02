========================================================================
   LAN FILE TRANSFER - READY-TO-USE PORTABLE EDITION
========================================================================

This package was compiled by the automated GitHub Actions compiler workflow.
It is 100% self-contained and pre-bundled for Portable Node.js.

------------------------------------------------------------------------
QUICK START (3 EASY STEPS):
------------------------------------------------------------------------

1. PLACE YOUR PORTABLE NODE.JS IN THIS FOLDER:
   - If you have portable Node.js for Windows:
     Place `node.exe` right here next to `start.bat`.
     (Or place it inside a `bin\` or `nodejs\` folder if preferred).

   - If you are on Linux or macOS:
     Place your `node` binary here next to `start.sh` and make sure it has
     execution permissions (`chmod +x node start.sh`).

2. LAUNCH THE SERVER:
   - On Windows: Double-click `start.bat`.
   - On Linux/macOS: Run `./start.sh` in a terminal.

3. CONNECT & TRANSFER:
   - The server will automatically open http://localhost:3000 in your browser.
   - Any device on the same local network (phones, laptops, other PCs) can open
     your local IP (e.g., http://192.168.1.X:3000) to upload, download, and
     sync notes immediately.

------------------------------------------------------------------------
FOLDER STRUCTURE:
------------------------------------------------------------------------
.
├── start.bat                  <-- Windows 1-click launcher
├── start.sh                   <-- Linux/macOS 1-click launcher
├── node.exe                   <-- (DROP YOUR PORTABLE NODE.JS HERE)
├── dist/                      <-- Pre-compiled frontend + standalone server
│   ├── server.cjs             <-- Self-contained backend bundle
│   ├── index.html             <-- Web interface
│   └── assets/                <-- React UI components & stylesheets
├── uploads/                   <-- Local folder where shared files are stored
└── README_PORTABLE.txt        <-- This help guide

------------------------------------------------------------------------
NO DEPENDENCIES OR INSTALLATION REQUIRED:
------------------------------------------------------------------------
- NO `npm install` is needed! All server code is pre-compiled and bundled.
- NO installation to Windows Registry or AppData.
- Store this entire folder on a USB thumb drive and run it anywhere!
========================================================================
