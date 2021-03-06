// Looks at the git tags and sha to output the version.

let commit, version;
const fs = require('fs');
const { execSync } = require('child_process');

try {
  commit = execSync('git rev-parse HEAD', { stdio: [] }).toString();
} catch (e) {}
try {
  version = require('../package.json').version;
} catch (e) {}

fs.writeFileSync('webapp/version.json', JSON.stringify({ commit, version }));
