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
      'src/components/ui/brand/AppIcon.tsx',
      'src/components/ui/brand/BrandLogo.tsx',
      'src/components/ui/button/AppButton.tsx',
      'src/components/ui/feedback/AppFormError.tsx',
      'src/components/ui/feedback/BrandLoading.tsx',
      'src/components/ui/feedback/ConfirmModal.tsx',
      'src/components/ui/input/AppTextInput.tsx',
      'src/components/ui/input/FieldTextInput.tsx',
      'src/components/ui/layout/ScreenScroll.tsx',
      'src/components/ui/navigation/BottomActionBar.tsx',
      'src/components/ui/navigation/BottomNavigation.tsx',
      'src/components/ui/navigation/TopAppHeader.tsx',
      'src/components/ui/selection/AnswerOption.tsx',
      'src/components/ui/selection/AppSwitch.tsx',
      'src/features/auth/components/AuthHeader.tsx',
      'src/features/home/components/HomeFeatureRow.tsx',
      'src/features/home/components/StreakCard.tsx',
      'src/features/home/components/ContinueLearningCard.tsx',
      'src/features/home/components/ReviewNeededCard.tsx',
      'src/features/profile/components/ProfileSection.tsx',
      'src/features/profile/components/ProfileSummaryCard.tsx',
      'src/features/settings/components/SettingRow.tsx',
      'src/components/ui/learning/CompletionHero.tsx',
      'src/components/ui/learning/Feedback.tsx',
      'src/components/ui/learning/LearningScreen.tsx',
      'src/components/ui/learning/NumberedLearningRow.tsx',
      'src/components/ui/learning/PathStatusCard.tsx',
      'src/components/ui/learning/ProgressBanner.tsx',
      'src/components/ui/learning/ResultMetric.tsx',
      'src/features/vocabulary/components/ExpressionCard.tsx',
      'src/features/vocabulary/components/InsightPanel.tsx',
      'src/features/vocabulary/components/PromptCard.tsx',
      'src/features/vocabulary/components/SituationCard.tsx',
      'src/assets/icons/eye.png',
      'src/assets/icons/eye-off.png',
      'src/assets/brand/welcome-hero.png',
    ]) {
      expect(existsSync(resolve(ROOT, path))).toBe(true);
    }
  });
});
