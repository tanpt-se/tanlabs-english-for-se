import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/core/auth/AuthProvider';
import { fetchProfile } from '@/core/profile/service';

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }
      return fetchProfile(user.id);
    },
  });
}
