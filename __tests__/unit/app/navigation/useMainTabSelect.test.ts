import { learningDisabledDestinations } from '@/app/navigation/learningDisabledDestinations';
import { useMainTabSelect } from '@/app/navigation/useMainTabSelect';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@/core/remote-config/useFeatureFlags', () => ({
  useFeatureFlags: jest.fn(),
}));

describe('useMainTabSelect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useFeatureFlags).mockReturnValue({
      data: { grammar: false, vocabulary: true, interview: false, ai: false },
    } as never);
  });

  it('routes home and profile tabs', () => {
    const onSelect = useMainTabSelect();
    onSelect('home');
    onSelect('profile');
    expect(mockNavigate).toHaveBeenCalledWith('Home');
    expect(mockNavigate).toHaveBeenCalledWith('Settings');
  });

  it('opens vocabulary and grammar only when flags are enabled', () => {
    const onSelect = useMainTabSelect();
    onSelect('vocabulary');
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyHome');

    jest.mocked(useFeatureFlags).mockReturnValue({
      data: { grammar: true, vocabulary: false, interview: false, ai: false },
    } as never);
    mockNavigate.mockClear();
    const grammarOn = useMainTabSelect();
    grammarOn('grammar');
    expect(mockNavigate).toHaveBeenCalledWith('Grammar', { screen: 'GrammarHome' });

    jest.mocked(useFeatureFlags).mockReturnValue({
      data: { grammar: false, vocabulary: false, interview: false, ai: false },
    } as never);
    mockNavigate.mockClear();
    const gated = useMainTabSelect();
    gated('vocabulary');
    gated('grammar');
    gated('interview');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('disables learning tabs until flags are strictly true', () => {
    expect(learningDisabledDestinations(undefined)).toEqual(['interview', 'grammar', 'vocabulary']);
    expect(
      learningDisabledDestinations({
        grammar: true,
        vocabulary: true,
        interview: false,
        ai: false,
      }),
    ).toEqual(['interview']);
  });
});
