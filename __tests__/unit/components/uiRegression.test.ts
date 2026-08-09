import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (/\.(tsx|jsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/** Remove JSX expression containers so `=>` / ternaries cannot fake a tag close. */
function stripJsxExpressions(source: string): string {
  let previous = '';
  let next = source;
  while (previous !== next) {
    previous = next;
    next = previous.replace(/\{[^{}]*\}/g, '{}');
  }
  return next;
}

describe('WP-04 UI regression guards', () => {
  it('guards scoped screens against deprecated SafeAreaView imports', () => {
    const files = walk(resolve(ROOT, 'src'));
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      expect(text).not.toMatch(
        /import\s*\{[^}]*\bSafeAreaView\b[^}]*\}\s*from\s*['"]react-native['"]/,
      );
    }
  });

  it('guards against raw string children on View/Pressable shells', () => {
    const files = walk(resolve(ROOT, 'src/features')).concat(walk(resolve(ROOT, 'src/components')));
    for (const file of files) {
      const text = stripJsxExpressions(readFileSync(file, 'utf8'));
      expect(text).not.toMatch(/<(View|Pressable)\b[^>]*>\s*['"`][^'"`]+['"`]/);
      expect(text).not.toMatch(/<(View|Pressable)\b[^>]*>\s*[A-Za-z0-9][^<{]*</);
    }
  });

  it('keeps theme and product control modules present', () => {
    for (const path of [
      'src/theme/palette.ts',
      'src/theme/index.ts',
      'src/components/ui/AppControls.tsx',
      'src/components/ui/ScreenScroll.tsx',
      'src/components/ui/AuthHeader.tsx',
      'src/components/ui/SettingRow.tsx',
      'src/components/ui/ProfileSection.tsx',
    ]) {
      expect(existsSync(resolve(ROOT, path))).toBe(true);
    }
  });
});
