import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

test('hardens the privileged device-token RPC', () => {
  const migration = source('supabase/migrations/006_security_hardening.sql');

  expect(migration).toContain("set search_path = ''");
  expect(migration).toContain(
    'revoke all on function public.claim_device_token(text, text) from public',
  );
  expect(migration).toContain(
    'grant execute on function public.claim_device_token(text, text) to authenticated',
  );
  expect(migration).toContain("raise exception 'Notifications disabled'");
  expect(migration).toContain('notification_settings_deactivate_devices');
});

test('pins GitHub Actions to immutable commit hashes', () => {
  const workflow = source('.github/workflows/pr.yml');
  const actionReferences = workflow.match(/uses: [^\s]+@([^\s]+)/g) ?? [];

  expect(actionReferences.length).toBeGreaterThan(0);
  for (const reference of actionReferences) {
    expect(reference).toMatch(/@[a-f0-9]{40}$/);
  }
});

test('declares collected iOS data and removes advertising identifiers on Android', () => {
  const privacyManifest = source('ios/TanLabsEnglishForSE/PrivacyInfo.xcprivacy');
  const androidManifest = source('android/app/src/main/AndroidManifest.xml');

  expect(privacyManifest).toContain('NSPrivacyCollectedDataTypeEmailAddress');
  expect(privacyManifest).toContain('NSPrivacyCollectedDataTypeDeviceID');
  expect(privacyManifest).toContain('NSPrivacyCollectedDataTypeCrashData');
  expect(androidManifest).toMatch(/AD_ID[^>]+tools:node="remove"/);
});
