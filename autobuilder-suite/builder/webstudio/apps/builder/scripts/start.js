import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const manifestPath = path.join(root, '.vercel', 'remix-build-result.json');

if (!fs.existsSync(manifestPath)) {
  console.error('remix build manifest not found at', manifestPath);
  process.exit(1);
}

const json = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const serverBundles = json.buildManifest.serverBundles;

let file;
if (serverBundles && serverBundles.root && serverBundles.root.file) {
  file = serverBundles.root.file;
} else {
  const keys = Object.keys(serverBundles || {});
  if (keys.length > 0) {
    file = serverBundles[keys[0]].file;
  }
}

if (!file) {
  console.error('No server bundle file found in build manifest');
  process.exit(1);
}

const full = path.join(root, file);
if (!fs.existsSync(full)) {
  console.error('Built server entry not found at', full);
  process.exit(1);
}

const port = process.env.PORT || '5173';
const child = spawn(process.execPath, [full, '--port', port], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code));
