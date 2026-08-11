import type { BottomNavDestination } from '@/components/ui/navigation';
import type { FeatureFlags } from '@/core/remote-config/parser';

/** Bottom-nav destinations that stay closed until their feature flags are strictly on. */
export function learningDisabledDestinations(
  flags: FeatureFlags | undefined,
): BottomNavDestination[] {
  const disabled: BottomNavDestination[] = ['interview'];
  if (flags?.grammar !== true) {
    disabled.push('grammar');
  }
  if (flags?.vocabulary !== true) {
    disabled.push('vocabulary');
  }
  return disabled;
}
