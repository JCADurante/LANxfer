import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const outputDir = path.join(rootDir, 'release-package');

console.log('📦 Starting Portable Package Assembly...');

// 1. Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  console.log('⚡ Building application first...');
  execSync('npm run build', { stdio: 'inherit' });
}

// 2. Prepare output directory
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });

// 3. Copy files to package directory
console.log('📋 Copying distribution files...');
fs.cpSync(distDir, path.join(outputDir, 'dist'), { recursive: true });

const filesToCopy = [
  'start.bat',
  'start.sh',
  'HOW_TO_USE.txt',
  'README_PORTABLE.txt',
  'PORTABLE_INSTRUCTIONS.md',
  '.env.example',
  'package.json'
];

for (const file of filesToCopy) {
  const src = path.join(rootDir, file);
  const dest = path.join(outputDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✓ Copied ${file}`);
  }
}

// 4. Create empty uploads directory marker
const uploadsDir = path.join(outputDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, '.gitkeep'), '');
}

console.log('✅ Portable Package directory ready at: ./release-package');
console.log('👉 To run with portable Node.js, put node.exe in ./release-package/ and double-click start.bat');
