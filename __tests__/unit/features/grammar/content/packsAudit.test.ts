import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

describe('grammar packs authoring audit', () => {
  it('passes the fail-closed packs audit', () => {
    const result = spawnSync('node', [resolve(process.cwd(), 'scripts/audit-grammar-packs.mjs')], {
      encoding: 'utf8',
      cwd: process.cwd(),
    });
    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || `audit exited ${result.status}`);
    }
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^OK /);
  });

  it('passes the workplace job-fit quality audit', () => {
    const result = spawnSync(
      'node',
      [resolve(process.cwd(), 'scripts/audit-grammar-quality.mjs')],
      {
        encoding: 'utf8',
        cwd: process.cwd(),
      },
    );
    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || `quality audit exited ${result.status}`);
    }
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^OK /);
  });
});
