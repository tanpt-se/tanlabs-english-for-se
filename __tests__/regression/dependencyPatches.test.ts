import { execFileSync } from 'node:child_process';

function runProbe(source: string) {
  expect(() =>
    execFileSync(process.execPath, ['-e', source], {
      cwd: process.cwd(),
      timeout: 2_000,
    }),
  ).not.toThrow();
}

test('rejects zero-length ICNS entries without hanging', () => {
  runProbe(`
    const { imageSize } = require('image-size');
    const input = Buffer.alloc(16);
    input.write('icns', 0);
    input.writeUInt32BE(16, 4);
    input.write('ic07', 8);
    input.writeUInt32BE(0, 12);
    try { imageSize(input); } catch {}
  `);
});

test('rejects zero-length JPEG XL boxes without hanging', () => {
  runProbe(`
    const path = require.resolve('image-size').replace('index.js', 'types/jxl.js');
    const { JXL } = require(path);
    const input = Buffer.alloc(16);
    input.write('jxlp', 4);
    try { JXL.calculate(input); } catch {}
  `);
});
