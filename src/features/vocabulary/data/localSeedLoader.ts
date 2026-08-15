export function loadLocalPackCatalog(): Promise<
  typeof import('@/features/vocabulary/data/localPackCatalog')
> {
  return import('@/features/vocabulary/data/localPackCatalog');
}
