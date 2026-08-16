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
      'src/features/grammar',
      'src/features/vocabulary',
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

  it('blocks feature screens/hooks/components from calling Supabase or Firebase messaging directly', () => {
    const featureFiles = walk(resolve(ROOT, 'src/features')).filter((file) => {
      const rel = relative(ROOT, file).replace(/\\/g, '/');
      // Feature services are the only allowed Supabase boundary under src/features.
      return !/\/services\//.test(rel);
    });
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

  it('keeps Grammar seed templates out of the mobile source graph', () => {
    const srcFiles = walk(resolve(ROOT, 'src'));
    for (const file of srcFiles) {
      const rel = relative(ROOT, file).replace(/\\/g, '/');
      // Preview catalog is the only allowed static bridge to packs.json (dev force-local).
      if (rel === 'src/features/grammar/services/localSeedCatalog.ts') {
        continue;
      }
      const text = readFileSync(file, 'utf8');
      expect(`${rel}:${text}`).not.toMatch(/from\s+['"][^'"]*supabase\/seed\/grammar[^'"]*['"]/);
      expect(`${rel}:${text}`).not.toMatch(/require\s*\(\s*['"][^'"]*packs\.json['"]\s*\)/);
      expect(`${rel}:${text}`).not.toMatch(/from\s+['"][^'"]*generate-grammar-seed-sql[^'"]*['"]/);
    }
    expect(existsSync(resolve(ROOT, 'supabase/seed/grammar/packs.json'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'supabase/seed/grammar/packs-v2.json'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'scripts/generate-grammar-v2-packs.mjs'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'scripts/generate-grammar-seed-sql.mjs'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'src/features/grammar/services/localSeedCatalog.ts'))).toBe(
      true,
    );
    expect(existsSync(resolve(ROOT, 'src/features/grammar/services/localSeedLoader.ts'))).toBe(
      true,
    );
  });

  it('keeps Vocabulary seed packs out of the mobile source graph', () => {
    const srcFiles = walk(resolve(ROOT, 'src'));
    for (const file of srcFiles) {
      const rel = relative(ROOT, file).replace(/\\/g, '/');
      if (rel === 'src/features/vocabulary/data/localPackCatalog.ts') {
        continue;
      }
      const text = readFileSync(file, 'utf8');
      expect(`${rel}:${text}`).not.toMatch(/from\s+['"][^'"]*supabase\/seed\/vocabulary[^'"]*['"]/);
      expect(`${rel}:${text}`).not.toMatch(
        /from\s+['"][^'"]*generate-vocabulary-seed-sql[^'"]*['"]/,
      );
    }
    expect(existsSync(resolve(ROOT, 'supabase/seed/vocabulary/core-expressions.json'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'supabase/seed/vocabulary/packs.json'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'src/features/vocabulary/data/localPackCatalog.ts'))).toBe(
      true,
    );
    expect(existsSync(resolve(ROOT, 'src/features/vocabulary/data/localSeedLoader.ts'))).toBe(true);
  });

  it('loads local Vocabulary seed only via dynamic import when force-local is on', () => {
    const contentService = read('src/features/vocabulary/services/contentService.ts');
    const loader = read('src/features/vocabulary/data/localSeedLoader.ts');
    expect(contentService).not.toMatch(/from\s+['"][^'"]*localPackCatalog['"]/);
    expect(contentService).toMatch(/loadLocalPackCatalog/);
    expect(loader).toMatch(
      /import\s*\(\s*['"]@\/features\/vocabulary\/data\/localPackCatalog['"]\s*\)/,
    );
  });

  it('loads local Grammar seed only via dynamic import when force-local is on', () => {
    const contentService = read('src/features/grammar/services/contentService.ts');
    const loader = read('src/features/grammar/services/localSeedLoader.ts');
    expect(contentService).not.toMatch(/from\s+['"][^'"]*localSeedCatalog['"]/);
    expect(contentService).toMatch(/loadLocalSeedCatalog/);
    expect(loader).toMatch(
      /import\s*\(\s*['"]@\/features\/grammar\/services\/localSeedCatalog['"]\s*\)/,
    );
  });

  it('keeps Grammar screens off Vocabulary feature modules and domain error imports', () => {
    const grammarScreens = walk(resolve(ROOT, 'src/features/grammar/screens'));
    for (const file of grammarScreens) {
      const rel = relative(ROOT, file).replace(/\\/g, '/');
      const text = readFileSync(file, 'utf8');
      expect(`${rel}:${text}`).not.toMatch(/from\s+['"]@\/features\/vocabulary/);
      expect(`${rel}:${text}`).not.toMatch(
        /from\s+['"]@\/features\/grammar\/services(?:\/errors)?['"]/,
      );
      expect(`${rel}:${text}`).not.toMatch(/\bpracticeReducer\b/);
    }
  });

  it('keeps Vocabulary screens off Grammar feature modules and domain error imports', () => {
    const vocabularyScreens = walk(resolve(ROOT, 'src/features/vocabulary/screens'));
    for (const file of vocabularyScreens) {
      const rel = relative(ROOT, file).replace(/\\/g, '/');
      const text = readFileSync(file, 'utf8');
      expect(`${rel}:${text}`).not.toMatch(/from\s+['"]@\/features\/grammar/);
      expect(`${rel}:${text}`).not.toMatch(
        /from\s+['"]@\/features\/vocabulary\/services(?:\/errors)?['"]/,
      );
    }
  });

  it('scopes PracticeSessionProvider to the practice flow navigator', () => {
    const grammarNav = read('src/features/grammar/navigation/GrammarNavigator.tsx');
    const practiceNav = read('src/features/grammar/navigation/GrammarPracticeFlowNavigator.tsx');
    expect(grammarNav).not.toMatch(/PracticeSessionProvider/);
    expect(practiceNav).toMatch(/PracticeSessionProvider/);

    const vocabularyNav = read('src/features/vocabulary/navigation/VocabularyNavigator.tsx');
    const vocabularyPracticeNav = read(
      'src/features/vocabulary/navigation/VocabularyPracticeFlowNavigator.tsx',
    );
    expect(vocabularyNav).not.toMatch(/PracticeSessionProvider/);
    expect(vocabularyPracticeNav).toMatch(/PracticeSessionProvider/);
  });

  it('documents APP_ENV selection for development/production', () => {
    const example = read('.env.example');
    expect(example).toMatch(/APP_ENV=development/);
    expect(example).toMatch(/production/);
    expect(example).not.toMatch(/^\s*#?\s*- staging:/m);
    expect(example).toMatch(/SUPABASE_URL/);
    expect(example).toMatch(/SUPABASE_ANON_KEY/);
    expect(example).not.toMatch(/^\s*SUPABASE_SERVICE_ROLE_KEY\s*=/m);
    expect(example).toMatch(/config\/firebase/);
  });
});
