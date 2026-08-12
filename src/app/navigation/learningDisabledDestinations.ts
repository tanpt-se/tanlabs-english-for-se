import type { BottomNavDestination } from '@/components/ui/navigation';
import type { FeatureFlags } from '@/core/remote-config/parser';

export function learningDisabledDestinations(
  flags: FeatureFlags | undefined,
): BottomNavDestination[] {
  const disabled: BottomNavDestination[] = [];
  if (flags?.interview !== true) {
    disabled.push('interview');
  }
  if (flags?.grammar !== true) {
    disabled.push('grammar');
  }
  if (flags?.vocabulary !== true) {
    disabled.push('vocabulary');
  }
  return disabled;
}
