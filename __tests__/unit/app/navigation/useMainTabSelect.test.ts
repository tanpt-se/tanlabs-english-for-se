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

  it('opens vocabulary only when the flag is enabled', () => {
    const onSelect = useMainTabSelect();
    onSelect('vocabulary');
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyHome');

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
});
