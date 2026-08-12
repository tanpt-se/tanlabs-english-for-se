export function loadLocalSeedCatalog(): Promise<
  typeof import('@/features/grammar/services/localSeedCatalog')
> {
  return import('@/features/grammar/services/localSeedCatalog');
}
