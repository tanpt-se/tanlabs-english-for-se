import { VOCABULARY_FORCE_LOCAL_SEED } from '@/app/config/env';
import { supabase } from '@/core/supabase/client';
import {
  VOCABULARY_LIBRARY_PAGE_SIZE,
  VOCABULARY_REMOTE_PAGE_SIZE,
} from '@/features/vocabulary/data/catalogConstants';
import { loadLocalPackCatalog } from '@/features/vocabulary/data/localSeedLoader';
import { loadWeakProgress, updateWeakProgress } from '@/features/vocabulary/data/weakProgressStore';
import {
  VocabularyDomainError,
  toVocabularyDomainError,
} from '@/features/vocabulary/services/errors';
import type {
  VocabularyExpression,
  VocabularyTermDetail,
} from '@/features/vocabulary/types/catalog';
import type {
  VocabularyExercise,
  VocabularyItemOutcome,
} from '@/features/vocabulary/types/content';
import { normalizeCefrLevel, type CefrLevel } from '@/features/vocabulary/utils/levels';
import { mapCatalogExpression, mapCatalogTerm } from '@/features/vocabulary/utils/mapCatalogItem';
import { mapPackExercise } from '@/features/vocabulary/utils/mapPackExercise';
import type { WeakProgressRow } from '@/features/vocabulary/utils/weakItems';
import { sortWeakItems } from '@/features/vocabulary/utils/weakItems';
import type { Json } from '@/types/database';

export type VocabularySituationSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  total: number;
  itemIds: string[];
  coreItemIds: string[];
};

export type VocabularySituationItems = {
  situation: VocabularySituationSummary;
  items: VocabularyExpression[];
  coreItems: VocabularyExpression[];
  shown: number;
  total: number;
  capped: boolean;
  levelTotals: Partial<Record<CefrLevel, number>>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function looksLikeUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function sanitizeIlikeFragment(value: string): string {
  return value
    .replace(/[%_,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchAllRows<T>(
  queryPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += VOCABULARY_REMOTE_PAGE_SIZE) {
    const { data, error } = await queryPage(from, from + VOCABULARY_REMOTE_PAGE_SIZE - 1);
    if (error) throw error;
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < VOCABULARY_REMOTE_PAGE_SIZE) {
      break;
    }
  }
  return rows;
}

export type CompleteVocabularyAttemptInput = {
  clientAttemptId: string;
  situationId: string;
  contentRevision: number;
  correctCount: number;
  totalCount: number;
  score: number;
  itemResults: VocabularyItemOutcome[];
  startedAt: string;
  completedAt: string;
};

export async function getSituations(): Promise<VocabularySituationSummary[]> {
  if (VOCABULARY_FORCE_LOCAL_SEED) {
    const local = await loadLocalPackCatalog();
    return local.getLocalSituations().map((situation) => ({
      id: situation.id,
      slug: situation.id,
      title: situation.title,
      description: situation.description,
      total: situation.total,
      itemIds: local
        .getLocalExpressions(situation.id, Number.MAX_SAFE_INTEGER)
        .map((item) => item.id),
      coreItemIds: local.getLocalCoreItemIds(situation.id),
    }));
  }
  try {
    const { data, error } = await supabase
      .from('vocabulary_situations')
      .select('id, slug, title, description')
      .eq('published', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    const rows = data ?? [];
    const itemRows = await fetchAllRows<{ id: string; situation_id: string; is_core: boolean }>(
      (from, to) =>
        supabase
          .from('vocabulary_items')
          .select('id, situation_id, is_core')
          .eq('published', true)
          .order('id', { ascending: true })
          .range(from, to),
    );
    const idsBySituation = new Map<string, string[]>();
    const coreIdsBySituation = new Map<string, string[]>();
    for (const item of itemRows ?? []) {
      const list = idsBySituation.get(item.situation_id) ?? [];
      list.push(item.id);
      idsBySituation.set(item.situation_id, list);
      if (item.is_core) {
        const core = coreIdsBySituation.get(item.situation_id) ?? [];
        core.push(item.id);
        coreIdsBySituation.set(item.situation_id, core);
      }
    }
    return rows.map((row) => {
      const itemIds = idsBySituation.get(row.id) ?? [];
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        total: itemIds.length,
        itemIds,
        coreItemIds: coreIdsBySituation.get(row.id) ?? [],
      };
    });
  } catch (error) {
    throw toVocabularyDomainError(error);
  }
}

export async function getSituation(
  situationIdOrSlug: string,
): Promise<VocabularySituationSummary | null> {
  if (VOCABULARY_FORCE_LOCAL_SEED) {
    const local = await loadLocalPackCatalog();
    const situation = local.getLocalSituation(situationIdOrSlug);
    if (!situation) return null;
    return {
      id: situation.id,
      slug: situation.id,
      title: situation.title,
      description: situation.description,
      total: situation.total,
      itemIds: local
        .getLocalExpressions(situation.id, Number.MAX_SAFE_INTEGER)
        .map((item) => item.id),
      coreItemIds: local.getLocalCoreItemIds(situation.id),
    };
  }
  try {
    let query = supabase
      .from('vocabulary_situations')
      .select('id, slug, title, description')
      .eq('published', true);
    query = looksLikeUuid(situationIdOrSlug)
      ? query.eq('id', situationIdOrSlug)
      : query.eq('slug', situationIdOrSlug);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const itemRows = await fetchAllRows<{ id: string; is_core: boolean }>((from, to) =>
      supabase
        .from('vocabulary_items')
        .select('id, is_core')
        .eq('situation_id', data.id)
        .eq('published', true)
        .order('core_order', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true })
        .range(from, to),
    );
    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      description: data.description,
      total: itemRows.length,
      itemIds: itemRows.map((row) => row.id),
      coreItemIds: itemRows.filter((row) => row.is_core).map((row) => row.id),
    };
  } catch (error) {
    throw toVocabularyDomainError(error);
  }
}

export async function getSituationExercises(situationSlug: string): Promise<VocabularyExercise[]> {
  if (VOCABULARY_FORCE_LOCAL_SEED) {
    const local = await loadLocalPackCatalog();
    const mapped = local.getLocalSituationExercises(situationSlug);
    if (mapped.length === 0) {
      throw new VocabularyDomainError('not_found', 'Situation not found.');
    }
    return mapped;
  }
  try {
    const situation = await getSituation(situationSlug);
    if (!situation) {
      throw new VocabularyDomainError('not_found', 'Situation not found.');
    }
    const { data, error } = await supabase
      .from('vocabulary_exercises')
      .select(
        'id, situation_id, item_id, exercise_key, type, prompt, payload, feedback, content_schema_version, sort_order',
      )
      .eq('situation_id', situation.id)
      .eq('published', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []).flatMap((row) => {
      const mapped = mapRemoteExerciseRow(situation.slug, row);
      return mapped ? [mapped] : [];
    });
  } catch (error) {
    throw toVocabularyDomainError(error);
  }
}

export async function getSituationItems(
  situationIdOrSlug: string,
): Promise<VocabularySituationItems | null> {
  if (VOCABULARY_FORCE_LOCAL_SEED) {
    const situation = await getSituation(situationIdOrSlug);
    if (!situation) {
      return null;
    }
    const local = await loadLocalPackCatalog();
    const items = local.getLocalExpressions(situation.slug, Number.MAX_SAFE_INTEGER);
    const coreItems = local.getLocalCoreExpressions(situation.slug);
    const total = local.getLocalExpressionTotal(situation.slug);
    return {
      situation: { ...situation, total },
      items,
      coreItems,
      shown: items.length,
      total,
      capped: total > items.length,
      levelTotals: local.getLocalLevelTotals(situation.slug),
    };
  }
  try {
    const situation = await getSituation(situationIdOrSlug);
    if (!situation) {
      return null;
    }
    const data = await fetchAllRows<{
      id: string;
      item_key: string;
      type: string;
      term: string;
      meaning: string;
      context: string;
      level: string;
      pos: string | null;
      content: unknown;
      sort_order: number;
      is_core: boolean;
      core_order: number | null;
      pronunciation: string | null;
      countability: string | null;
    }>((from, to) =>
      supabase
        .from('vocabulary_items')
        .select(
          'id, item_key, type, term, meaning, context, level, pos, content, sort_order, is_core, core_order, pronunciation, countability',
        )
        .eq('situation_id', situation.id)
        .eq('published', true)
        .order('is_core', { ascending: false })
        .order('core_order', { ascending: true, nullsFirst: false })
        .order('sort_order', { ascending: true })
        .range(from, to),
    );
    const items = data.map((row) =>
      mapCatalogExpression({
        id: row.id,
        item_key: row.item_key,
        type: row.type,
        term: row.term,
        meaning: row.meaning,
        context: row.context,
        level: row.level,
        pos: row.pos,
        content: row.content,
        is_core: row.is_core,
        core_order: row.core_order,
        pronunciation: row.pronunciation,
        countability: row.countability,
      }),
    );
    const coreItems = items
      .filter((item) => item.isCore)
      .sort((a, b) => (a.coreOrder ?? 99) - (b.coreOrder ?? 99));
    const levelTotals = data.reduce<Partial<Record<CefrLevel, number>>>((totals, row) => {
      const level = normalizeCefrLevel(row.level);
      totals[level] = (totals[level] ?? 0) + 1;
      return totals;
    }, {});
    return {
      situation,
      items,
      coreItems,
      shown: items.length,
      total: situation.total,
      capped: situation.total > items.length,
      levelTotals,
    };
  } catch (error) {
    throw toVocabularyDomainError(error);
  }
}

export async function getVocabularyTerm(
  situationIdOrSlug: string,
  itemId: string,
): Promise<VocabularyTermDetail | null> {
  if (VOCABULARY_FORCE_LOCAL_SEED) {
    const local = await loadLocalPackCatalog();
    return local.getLocalTerm(situationIdOrSlug, itemId) ?? null;
  }
  try {
    const situation = await getSituation(situationIdOrSlug);
    if (!situation) {
      return null;
    }
    const itemLooksLikeUuid = looksLikeUuid(itemId);
    const itemKey = itemId.includes(':') ? itemId.slice(itemId.indexOf(':') + 1) : itemId;
    let query = supabase
      .from('vocabulary_items')
      .select(
        'id, item_key, type, term, meaning, context, level, pos, content, pronunciation, countability, is_core, core_order',
      )
      .eq('situation_id', situation.id)
      .eq('published', true);
    query = itemLooksLikeUuid ? query.eq('id', itemId) : query.eq('item_key', itemKey);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) {
      return null;
    }
    return mapCatalogTerm(situation.slug, {
      id: data.id,
      item_key: data.item_key,
      type: data.type,
      term: data.term,
      meaning: data.meaning,
      context: data.context,
      level: data.level,
      pos: data.pos,
      content: data.content,
      pronunciation: (data as { pronunciation?: string | null }).pronunciation ?? null,
      countability: (data as { countability?: string | null }).countability ?? null,
      is_core: (data as { is_core?: boolean }).is_core,
      core_order: (data as { core_order?: number | null }).core_order ?? null,
    });
  } catch (error) {
    throw toVocabularyDomainError(error);
  }
}

export { VOCABULARY_LIBRARY_PAGE_SIZE } from '@/features/vocabulary/data/catalogConstants';

export type VocabularyLibraryQuery = {
  query?: string;
  situationSlug?: string;
  level?: CefrLevel | 'all';
  offset?: number;
  limit?: number;
};

export type VocabularyLibraryPage = {
  items: VocabularyExpression[];
  total: number;
  offset: number;
  limit: number;
};

export async function searchVocabularyLibrary(
  input: VocabularyLibraryQuery = {},
): Promise<VocabularyLibraryPage> {
  const offset = Math.max(0, input.offset ?? 0);
  const limit = Math.max(1, Math.min(100, input.limit ?? VOCABULARY_LIBRARY_PAGE_SIZE));
  const query = (input.query ?? '').trim();
  const situationSlug =
    input.situationSlug && input.situationSlug !== 'all' ? input.situationSlug : undefined;
  const level = input.level && input.level !== 'all' ? input.level : undefined;

  if (VOCABULARY_FORCE_LOCAL_SEED) {
    const local = await loadLocalPackCatalog();
    const page = local.searchLocalLibrary({
      query,
      situationSlug,
      level,
      offset,
      limit,
    });
    return { ...page, offset, limit };
  }

  try {
    let situationId: string | undefined;
    if (situationSlug) {
      const situation = await getSituation(situationSlug);
      if (!situation) {
        return { items: [], total: 0, offset, limit };
      }
      situationId = situation.id;
    }

    let request = supabase
      .from('vocabulary_items')
      .select(
        'id, item_key, type, term, meaning, context, level, pos, content, is_core, core_order, pronunciation, countability, sort_order, vocabulary_situations!inner(slug, title)',
        { count: 'exact' },
      )
      .eq('published', true)
      .order('is_core', { ascending: false })
      .order('library_rank', { ascending: true })
      .order('core_order', { ascending: true, nullsFirst: false })
      .order('sort_order', { ascending: true })
      .range(offset, offset + limit - 1);
    if (situationId) {
      request = request.eq('situation_id', situationId);
    }
    if (query) {
      const fragment = sanitizeIlikeFragment(query);
      if (fragment) {
        request = request.or(`term.ilike.%${fragment}%,meaning.ilike.%${fragment}%`);
      }
    }
    if (level) {
      request = request.eq('level', level);
    }
    const { data, error, count } = await request;
    if (error) throw error;
    const items = (data ?? []).map((row) => {
      const nested = (
        row as {
          vocabulary_situations?:
            | { slug?: string; title?: string }
            | Array<{ slug?: string; title?: string }>;
        }
      ).vocabulary_situations;
      const situation = Array.isArray(nested) ? nested[0] : nested;
      const mapped = mapCatalogExpression(row as never);
      return {
        ...mapped,
        situationSlug: situation?.slug,
        situationTitle: situation?.title,
      };
    });
    return { items, total: count ?? items.length, offset, limit };
  } catch (error) {
    throw toVocabularyDomainError(error);
  }
}

type RemoteExerciseRow = {
  id: string;
  situation_id: string;
  item_id: string | null;
  exercise_key: string;
  type: string;
  prompt: string;
  payload: unknown;
  feedback: unknown;
  sort_order: number;
};

function mapRemoteExerciseRow(
  situationSlug: string,
  row: RemoteExerciseRow,
): VocabularyExercise | null {
  const payload = row.payload as Record<string, unknown>;
  const feedback = (row.feedback ?? {}) as Record<string, string>;
  const mapped = mapPackExercise(
    situationSlug,
    {
      key: row.exercise_key,
      term: feedback.expression ?? row.exercise_key,
      meaning: feedback.meaning ?? '',
      context: feedback.context ?? '',
    },
    {
      key: row.exercise_key,
      type: row.type,
      prompt: row.prompt,
      payload,
      feedback,
      sortOrder: row.sort_order,
    },
  );
  if (!mapped) return null;
  return {
    ...mapped,
    id: row.id,
    situationId: row.situation_id,
    itemId: row.item_id,
  };
}

function situationSlugFromNested(nested: unknown): string | null {
  const item = Array.isArray(nested)
    ? (nested[0] as { slug?: string } | undefined)
    : (nested as { slug?: string } | null);
  return item?.slug || null;
}

/** Load published exercises for weak item IDs across every situation they belong to. */
export async function getExercisesForItemIds(
  itemIds: readonly string[],
): Promise<VocabularyExercise[]> {
  const uniqueIds = [...new Set(itemIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return [];
  }
  const allowed = new Set(uniqueIds);

  if (VOCABULARY_FORCE_LOCAL_SEED) {
    // Local packs use composite ids `situationSlug:itemKey`.
    const situationSlugs = [
      ...new Set(
        uniqueIds
          .map((itemId) => itemId.split(':')[0])
          .filter((slug): slug is string => Boolean(slug)),
      ),
    ];
    const pools = await Promise.all(
      situationSlugs.map(async (slug) => {
        try {
          return await getSituationExercises(slug);
        } catch {
          return [] as VocabularyExercise[];
        }
      }),
    );
    return pools.flat().filter((exercise) => exercise.itemId && allowed.has(exercise.itemId));
  }

  try {
    const { data, error } = await supabase
      .from('vocabulary_exercises')
      .select(
        'id, situation_id, item_id, exercise_key, type, prompt, payload, feedback, content_schema_version, sort_order, vocabulary_situations(slug)',
      )
      .in('item_id', uniqueIds)
      .eq('published', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []).flatMap((row) => {
      const slug = situationSlugFromNested(
        (row as { vocabulary_situations?: unknown }).vocabulary_situations,
      );
      if (!slug || !row.item_id || !allowed.has(row.item_id)) {
        return [];
      }
      const mapped = mapRemoteExerciseRow(slug, row);
      return mapped ? [mapped] : [];
    });
  } catch (error) {
    throw toVocabularyDomainError(error);
  }
}

export async function getWeakProgress(userId: string): Promise<WeakProgressRow[]> {
  if (!userId) {
    throw new VocabularyDomainError('unauthorized', 'Sign in to load Vocabulary progress.');
  }
  if (VOCABULARY_FORCE_LOCAL_SEED) {
    const map = await loadWeakProgress();
    return sortWeakItems([...map.values()]);
  }
  try {
    const { data, error } = await supabase
      .from('user_vocabulary_progress')
      .select(
        'item_id, correct_count, incorrect_count, last_result, last_seen_at, vocabulary_items(sort_order, term)',
      )
      .eq('user_id', userId);
    if (error) throw error;
    const rows: WeakProgressRow[] = (data ?? []).map((row) => {
      const nested = row.vocabulary_items as unknown;
      const item = Array.isArray(nested)
        ? (nested[0] as { sort_order?: number; term?: string } | undefined)
        : (nested as { sort_order?: number; term?: string } | null);
      return {
        itemId: row.item_id,
        correctCount: row.correct_count,
        incorrectCount: row.incorrect_count,
        lastResult: row.last_result,
        lastSeenAt: row.last_seen_at,
        sortOrder: item?.sort_order ?? 0,
        term: item?.term ?? null,
      };
    });
    return sortWeakItems(rows);
  } catch (error) {
    throw toVocabularyDomainError(error);
  }
}

export async function completeVocabularyAttempt(
  userId: string,
  input: CompleteVocabularyAttemptInput,
): Promise<void> {
  if (!userId) {
    throw new VocabularyDomainError('unauthorized', 'Sign in to save Vocabulary progress.');
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) {
    throw new VocabularyDomainError('unauthorized', 'Sign in to save your progress.');
  }
  if (data.user.id !== userId) {
    throw new VocabularyDomainError(
      'unauthorized',
      'Session changed. Sign in again to save progress.',
    );
  }
  if (VOCABULARY_FORCE_LOCAL_SEED) {
    await updateWeakProgress(input.itemResults);
    return;
  }
  try {
    if (input.situationId === 'weak') {
      await completeWeakVocabularyAttempt(input);
      return;
    }
    await rpcCompleteVocabularyAttempt(input);
  } catch (caught) {
    throw toVocabularyDomainError(caught);
  }
}

/** Stable UUID so weak multi-situation retries stay idempotent per situation bucket. */
export function deriveWeakClientAttemptId(baseAttemptId: string, situationId: string): string {
  const mixHex = (left: string, right: string) => {
    const a = left
      .replace(/[^a-f0-9]/gi, '0')
      .toLowerCase()
      .padEnd(32, '0')
      .slice(0, 32);
    const b = right
      .replace(/[^a-f0-9]/gi, '0')
      .toLowerCase()
      .padEnd(32, '0')
      .slice(0, 32);
    let out = '';
    for (let i = 0; i < 32; i += 1) {
      const sum = Number.parseInt(a[i] ?? '0', 16) + Number.parseInt(b[i] ?? '0', 16);
      out += (sum % 16).toString(16);
    }
    return out;
  };
  const hex = mixHex(baseAttemptId, situationId);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(
    17,
    20,
  )}-${hex.slice(20, 32)}`;
}

async function completeWeakVocabularyAttempt(input: CompleteVocabularyAttemptInput): Promise<void> {
  const groups = new Map<string, VocabularyItemOutcome[]>();
  for (const row of input.itemResults) {
    const situationId = row.situationId?.trim();
    if (!situationId || situationId === 'weak') {
      throw new VocabularyDomainError(
        'unavailable',
        'Weak practice is missing situation metadata for an item.',
      );
    }
    const list = groups.get(situationId) ?? [];
    list.push(row);
    groups.set(situationId, list);
  }
  if (groups.size === 0) {
    throw new VocabularyDomainError('unavailable', 'Weak practice has no item results to save.');
  }
  for (const [situationId, rows] of groups) {
    const correctCount = rows.filter((row) => row.correct).length;
    const totalCount = rows.length;
    const score = Math.round((correctCount / totalCount) * 100);
    await rpcCompleteVocabularyAttempt({
      ...input,
      clientAttemptId: deriveWeakClientAttemptId(input.clientAttemptId, situationId),
      situationId,
      correctCount,
      totalCount,
      score,
      itemResults: rows,
    });
  }
}

async function rpcCompleteVocabularyAttempt(input: CompleteVocabularyAttemptInput): Promise<void> {
  const { error: rpcError } = await supabase.rpc('complete_vocabulary_attempt', {
    p_client_attempt_id: input.clientAttemptId,
    p_situation_id: input.situationId,
    p_content_revision: input.contentRevision,
    p_correct_count: input.correctCount,
    p_total_count: input.totalCount,
    p_score: input.score,
    p_item_results: input.itemResults.map((row) => ({
      itemId: row.itemId,
      correct: row.correct,
    })) as unknown as Json,
    p_started_at: input.startedAt,
    p_completed_at: input.completedAt,
  });
  if (rpcError) throw rpcError;
}
