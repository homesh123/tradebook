// Copies the production build to the repository root, which GitHub Pages serves at /tradebook.
const fs = require('fs');
const path = require('path');

const build = path.join(__dirname, '..', 'build');
const root = path.join(__dirname, '..', '..');

fs.rmSync(path.join(root, 'static'), { recursive: true, force: true });
fs.cpSync(build, root, { recursive: true });
console.log('Published build to', root);
