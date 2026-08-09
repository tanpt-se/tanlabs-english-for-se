import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const allowed = new Set(['GHSA-5p2g-fcmc-qvqq', 'GHSA-w3rx-r6r6-pgpr']);
const audit = spawnSync('pnpm', ['audit', '--prod', '--json'], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

if (!audit.stdout) {
  process.stderr.write(audit.stderr || 'Dependency audit produced no output.\n');
  process.exit(1);
}

const report = JSON.parse(audit.stdout);
const advisories = Object.values(report.advisories ?? {});
const unexpected = advisories.filter((advisory) => !allowed.has(advisory.github_advisory_id));

if (unexpected.length > 0) {
  for (const advisory of unexpected) {
    console.error(`${advisory.severity}: ${advisory.github_advisory_id} ${advisory.title}`);
  }
  process.exit(1);
}

const icns = readFileSync('node_modules/image-size/dist/types/icns.js', 'utf8');
const jxl = readFileSync('node_modules/image-size/dist/types/jxl.js', 'utf8');
const boxUtils = readFileSync('node_modules/image-size/dist/types/utils.js', 'utf8');
const patchApplied =
  icns.includes('Invalid ICNS image entry length') &&
  jxl.includes('Invalid JPEG XL box size') &&
  boxUtils.includes('box.size > 0 ? box.size : 8');

if (advisories.length > 0 && !patchApplied) {
  console.error('Allowlisted image-size advisories are present without the required local guards.');
  process.exit(1);
}

console.log(
  advisories.length === 0
    ? 'Dependency audit PASSED.'
    : 'Dependency audit PASSED with two locally patched image-size advisories.',
);
