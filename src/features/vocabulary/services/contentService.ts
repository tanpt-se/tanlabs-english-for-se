import { VOCABULARY_FORCE_LOCAL_SEED } from '@/app/config/env';
import { supabase } from '@/core/supabase/client';
import {
  getLocalSituation,
  getLocalSituationExercises,
  getLocalSituations,
} from '@/features/vocabulary/data/localPackCatalog';
import { loadWeakProgress, updateWeakProgress } from '@/features/vocabulary/data/weakProgressStore';
import {
  VocabularyDomainError,
  toVocabularyDomainError,
} from '@/features/vocabulary/services/errors';
import type {
  VocabularyExercise,
  VocabularyItemOutcome,
} from '@/features/vocabulary/types/content';
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
};

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
    return getLocalSituations().map((situation) => ({
      id: situation.id,
      slug: situation.id,
      title: situation.title,
      description: situation.description,
      total: situation.total,
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
    const withCounts: VocabularySituationSummary[] = [];
    for (const row of rows) {
      const { count, error: countError } = await supabase
        .from('vocabulary_items')
        .select('id', { count: 'exact', head: true })
        .eq('situation_id', row.id)
        .eq('published', true);
      if (countError) throw countError;
      withCounts.push({
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        total: count ?? 0,
      });
    }
    return withCounts;
  } catch (error) {
    throw toVocabularyDomainError(error);
  }
}

export async function getSituation(
  situationIdOrSlug: string,
): Promise<VocabularySituationSummary | null> {
  if (VOCABULARY_FORCE_LOCAL_SEED) {
    const situation = getLocalSituation(situationIdOrSlug);
    if (!situation) return null;
    return {
      id: situation.id,
      slug: situation.id,
      title: situation.title,
      description: situation.description,
      total: situation.total,
    };
  }
  try {
    const { data, error } = await supabase
      .from('vocabulary_situations')
      .select('id, slug, title, description')
      .eq('published', true)
      .or(`id.eq.${situationIdOrSlug},slug.eq.${situationIdOrSlug}`)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const { count } = await supabase
      .from('vocabulary_items')
      .select('id', { count: 'exact', head: true })
      .eq('situation_id', data.id)
      .eq('published', true);
    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      description: data.description,
      total: count ?? 0,
    };
  } catch (error) {
    throw toVocabularyDomainError(error);
  }
}

export async function getSituationExercises(situationSlug: string): Promise<VocabularyExercise[]> {
  if (VOCABULARY_FORCE_LOCAL_SEED) {
    const mapped = getLocalSituationExercises(situationSlug);
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
      const payload = row.payload as Record<string, unknown>;
      const feedback = row.feedback as Record<string, string>;
      const mapped = mapPackExercise(
        situation.slug,
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
      if (!mapped) return [];
      return [
        {
          ...mapped,
          id: row.id,
          situationId: row.situation_id,
          itemId: row.item_id,
        },
      ];
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
        'item_id, correct_count, incorrect_count, last_result, last_seen_at, vocabulary_items(sort_order)',
      )
      .eq('user_id', userId);
    if (error) throw error;
    const rows: WeakProgressRow[] = (data ?? []).map((row) => {
      const nested = row.vocabulary_items as unknown;
      const item = Array.isArray(nested)
        ? (nested[0] as { sort_order?: number } | undefined)
        : (nested as { sort_order?: number } | null);
      return {
        itemId: row.item_id,
        correctCount: row.correct_count,
        incorrectCount: row.incorrect_count,
        lastResult: row.last_result,
        lastSeenAt: row.last_seen_at,
        sortOrder: item?.sort_order ?? 0,
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
  } catch (caught) {
    throw toVocabularyDomainError(caught);
  }
}
