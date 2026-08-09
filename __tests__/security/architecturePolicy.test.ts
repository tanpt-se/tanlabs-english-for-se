import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = process.cwd();

function read(path: string) {
  return readFileSync(resolve(ROOT, path), 'utf8');
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) {
    return out;
  }
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'coverage') {
      continue;
    }
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('WP-03 architecture and dependency policy', () => {
  it('rejects third-party UI kits and npm lockfiles', () => {
    const pkg = JSON.parse(read('package.json')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    };
    for (const name of Object.keys(deps)) {
      expect(name).not.toMatch(/@gluestack|gluestack|tamagui|zustand|native-base/i);
    }
    expect(existsSync(resolve(ROOT, 'package-lock.json'))).toBe(false);
    expect(existsSync(resolve(ROOT, 'pnpm-lock.yaml'))).toBe(true);
    expect(pkg).toMatchObject({ packageManager: expect.stringMatching(/^pnpm@/) });
  });

  it('keeps canonical app/core/features/components/lib layout', () => {
    for (const dir of [
      'src/app/bootstrap',
      'src/app/config',
      'src/app/navigation',
      'src/app/providers',
      'src/core/auth',
      'src/core/profile',
      'src/core/notification',
      'src/core/remote-config',
      'src/features/auth',
      'src/features/profile',
      'src/features/settings',
      'src/components/ui',
      'src/lib',
    ]) {
      expect(existsSync(resolve(ROOT, dir))).toBe(true);
    }
  });

  it('blocks deprecated React Native SafeAreaView in app source', () => {
    const files = walk(resolve(ROOT, 'src')).concat(resolve(ROOT, 'App.tsx'));
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      expect(text).not.toMatch(
        /import\s*\{[^}]*\bSafeAreaView\b[^}]*\}\s*from\s*['"]react-native['"]/,
      );
    }
  });

  it('blocks feature screens from calling Supabase or Firebase messaging directly', () => {
    const featureFiles = walk(resolve(ROOT, 'src/features'));
    for (const file of featureFiles) {
      const text = readFileSync(file, 'utf8');
      const rel = relative(ROOT, file);
      expect(`${rel}:${text}`).not.toMatch(/from\s+['"]@\/core\/supabase\/client['"]/);
      expect(`${rel}:${text}`).not.toMatch(/from\s+['"]@supabase\/supabase-js['"]/);
      expect(`${rel}:${text}`).not.toMatch(/from\s+['"]@react-native-firebase\/messaging['"]/);
      expect(`${rel}:${text}`).not.toMatch(/supabase\s*\.\s*from\s*\(/);
      expect(`${rel}:${text}`).not.toMatch(/supabase\s*\.\s*auth\s*\./);
      expect(`${rel}:${text}`).not.toMatch(/getMessaging\s*\(/);
    }
  });

  it('documents APP_ENV selection for development/staging/production', () => {
    const example = read('.env.example');
    expect(example).toMatch(/APP_ENV=development/);
    expect(example).toMatch(/staging/);
    expect(example).toMatch(/production/);
    expect(example).toMatch(/SUPABASE_URL/);
    expect(example).toMatch(/SUPABASE_ANON_KEY/);
    expect(example).not.toMatch(/^\s*SUPABASE_SERVICE_ROLE_KEY\s*=/m);
  });
});
