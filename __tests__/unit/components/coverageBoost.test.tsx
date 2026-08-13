import React from 'react';
import { Modal, Text, TextInput, useColorScheme } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { AppIcon } from '@/components/ui/brand';
import { ConfirmModal } from '@/components/ui/feedback';
import { FieldTextInput } from '@/components/ui/input';
import { Feedback, LearningScreen, ProgressBanner } from '@/components/ui/learning';
import { AnswerOption, AppSwitch } from '@/components/ui/selection';
import { HomeFeatureRow, StreakCard } from '@/features/home/components';
import { ProfileSection, ProfileSummaryCard } from '@/features/profile/components';
import { SettingRow } from '@/features/settings/components';
import { ExpressionCard, InsightPanel, SituationCard } from '@/features/vocabulary/components';
import {
  getExpressions,
  getPracticeQuestions,
  getSituation,
} from '@/features/vocabulary/data/mockCatalog';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('PH1/PH3 coverage boost', () => {
  afterEach(() => {
    jest.mocked(useColorScheme).mockReturnValue('light');
  });

  it('covers ConfirmModal note, tones, and busy back handling', async () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <ConfirmModal
          visible
          title="Sign out?"
          message="Confirm leave"
          note="You can sign back in"
          confirmLabel="Sign out"
          confirmTone="danger"
          onCancel={onCancel}
          onConfirm={onConfirm}
        />,
      );
    });

    await act(() => {
      root.root.findByProps({ testID: 'confirm-modal-cancel' }).props.onPress();
      root.root.findByProps({ testID: 'confirm-modal-confirm' }).props.onPress();
    });
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalled();

    const modal = root.root.findByType(Modal);
    await act(() => {
      modal.props.onRequestClose();
    });
    expect(onCancel).toHaveBeenCalledTimes(2);

    await act(() => {
      root.update(
        <ConfirmModal
          busy
          visible
          title="Sign out?"
          message="Confirm leave"
          confirmLabel="Sign out"
          onCancel={onCancel}
          onConfirm={onConfirm}
        />,
      );
    });
    await act(() => {
      root.root.findByType(Modal).props.onRequestClose();
    });
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(root.root.findByProps({ testID: 'confirm-modal-confirm' }).props.label).toContain('…');
  }, 15000);

  it('covers FieldTextInput focus, error, helper, and disabled branches', async () => {
    const onBlur = jest.fn();
    const onFocus = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <FieldTextInput
          label="Email"
          value=""
          error
          helper="Required"
          onBlur={onBlur}
          onFocus={onFocus}
          onChangeText={() => undefined}
        />,
      );
    });

    const input = root.root.findByType(TextInput);
    await act(() => {
      input.props.onFocus({ nativeEvent: {} });
      input.props.onBlur({ nativeEvent: {} });
    });
    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();

    await act(() => {
      root.update(
        <FieldTextInput
          editable={false}
          label="Locked"
          mode="password"
          testID="locked"
          value="x"
          helper="Read only"
          onChangeText={() => undefined}
        />,
      );
    });
    expect(root.root.findByProps({ testID: 'locked-visibility' }).props.disabled).toBe(true);
  });

  it('covers Feedback, InsightPanel, and ExpressionCard variants', async () => {
    const onPress = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <>
          <Feedback type="error" title="Failed" message="Try again" />
          <Feedback type="info" title="Hint" message="Offline queue" />
          <InsightPanel tone="danger" title="Needs work" body="Name the blocker." />
          <InsightPanel tone="neutral" title="Note" body="Keep it short." />
          <ExpressionCard
            emphasis
            meta="STATUS"
            tag="BLOCKER"
            title="I’m blocked by the API dependency."
            onPress={onPress}
          />
          <ExpressionCard tag="STATUS" title="On track" />
          <LearningScreen footer={<Text>Footer</Text>}>
            <Text>Body</Text>
          </LearningScreen>
          <LearningScreen header={<Text>Sticky</Text>}>
            <Text>No footer</Text>
          </LearningScreen>
        </>,
      );
    });

    await act(() => {
      root.root
        .findByProps({
          accessibilityLabel: 'I’m blocked by the API dependency.. STATUS. BLOCKER',
        })
        .props.onPress();
    });
    expect(onPress).toHaveBeenCalled();
    expect(root.root.findAllByType(Text).some((node) => node.props.children === 'Failed')).toBe(
      true,
    );
  });

  it('covers HomeFeatureRow, SituationCard, ProgressBanner, and StreakCard branches', async () => {
    const onFeature = jest.fn();
    jest.mocked(useColorScheme).mockReturnValue('dark');
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <>
          <HomeFeatureRow
            icon="book"
            statusLabel="In progress"
            subtitle="Continue"
            title="Grammar"
            tone="progress"
            onPress={onFeature}
          />
          <HomeFeatureRow
            icon="vocabulary"
            statusLabel="Ready"
            subtitle="Start"
            title="Vocabulary"
            tone="available"
            onPress={onFeature}
          />
          <SituationCard
            title="Risk"
            description="Escalate early"
            progress="0 / 8"
            progressRatio={0}
            onPress={() => undefined}
          />
          <ProgressBanner title="Progress" subtitle="Dark banner" progress={0} />
          <StreakCard
            badge="Sprint"
            days={['complete', 'complete', 'today', 'upcoming', 'upcoming', 'upcoming', 'upcoming']}
          />
          <StreakCard />
          <AppIcon name="home" />
          <ProfileSection title="Only title">
            <Text>Child</Text>
          </ProfileSection>
        </>,
      );
    });

    const grammar = root.root.findByProps({ accessibilityLabel: 'Grammar' });
    await act(() => {
      grammar.props.onPress();
      if (typeof grammar.props.style === 'function') {
        grammar.props.style({ pressed: true });
        grammar.props.style({ pressed: false });
      }
    });
    expect(onFeature).toHaveBeenCalled();
    expect(root.root.findAllByType(Text).some((node) => node.props.children === 'Sprint')).toBe(
      true,
    );
  });

  it('covers ProfileSummaryCard initials and SettingRow chevron/disabled paths', async () => {
    const onEdit = jest.fn();
    const onPress = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <>
          <ProfileSummaryCard
            displayName="Ada Lovelace"
            levelLabel="B2"
            email="a@b.co"
            onEditPress={onEdit}
          />
          <ProfileSummaryCard displayName="Ada" levelLabel="B1" />
          <ProfileSummaryCard displayName="   " levelLabel="A2" />
          <SettingRow label="Appearance" value="System" showChevron onPress={onPress} />
          <SettingRow label="Busy" disabled showChevron onPress={onPress} />
          <SettingRow label="Quiet" disabled />
          <AppSwitch value={false} />
          <AppSwitch value accessibilityLabel="On" disabled onValueChange={() => undefined} />
          <AnswerOption label="Default" state="default" />
          <AnswerOption label="Wrong" state="incorrect" disabled />
        </>,
      );
    });

    await act(() => {
      root.root.findByProps({ accessibilityLabel: 'Edit profile' }).props.onPress();
      root.root.findByProps({ accessibilityLabel: 'Appearance' }).props.onPress();
      const appearance = root.root.findByProps({ accessibilityLabel: 'Appearance' });
      if (typeof appearance.props.style === 'function') {
        appearance.props.style({ pressed: true });
      }
    });
    expect(onEdit).toHaveBeenCalled();
    expect(onPress).toHaveBeenCalled();
    expect(root.root.findAllByType(Text).some((node) => node.props.children === '?')).toBe(true);
    expect(root.root.findAllByType(Text).some((node) => node.props.children === 'AD')).toBe(true);
    expect(root.root.findAllByType(Text).some((node) => node.props.children === '✕')).toBe(true);
  });

  it('covers mock catalog fallbacks', () => {
    expect(getSituation('missing')).toBeUndefined();
    expect(getExpressions('missing')[0]?.tag).toBe('ALIGN');
    expect(getPracticeQuestions('missing')).toHaveLength(1);
  });
});
