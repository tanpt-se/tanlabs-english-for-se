import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();

function read(path: string) {
  return readFileSync(resolve(ROOT, path), 'utf8');
}

describe('WP-08 Firebase environment mapping', () => {
  it('keeps tracked firebase config layout and examples', () => {
    for (const path of [
      'config/firebase/README.md',
      'config/firebase/development/google-services.json.example',
      'config/firebase/development/GoogleService-Info.plist.example',
      'config/firebase/production/google-services.json.example',
      'config/firebase/production/GoogleService-Info.plist.example',
      'scripts/select-firebase-config.sh',
      'scripts/verify-firebase-config.sh',
    ]) {
      expect(existsSync(resolve(ROOT, path))).toBe(true);
    }
  });

  it('locks package and bundle identifiers across examples', () => {
    expect(read('config/firebase/development/google-services.json.example')).toMatch(
      /com\.tanlabs\.enforse/,
    );
    expect(read('config/firebase/production/google-services.json.example')).toMatch(
      /com\.tanlabs\.enforse/,
    );
    expect(read('config/firebase/development/GoogleService-Info.plist.example')).toMatch(
      /com\.tanlabs\.en-for-se/,
    );
    expect(read('config/firebase/production/GoogleService-Info.plist.example')).toMatch(
      /com\.tanlabs\.en-for-se/,
    );
  });

  it('restricts AppEnv to development | production', () => {
    const envSource = read('src/app/config/env.ts');
    expect(envSource).toMatch(/export type AppEnv = 'development' \| 'production'/);
    expect(envSource).toMatch(/staging was removed/);
  });
});
