export type ContinueLearningProgressRow = {
  topicId: string;
  lessonId: string;
  status: string;
  lastActivityAt: string | null;
};

export type ContinueLearningTopic = {
  id: string;
  sortOrder: number;
};

export type ContinueLearningLesson = {
  id: string;
  sortOrder: number;
};

export type ContinueLearningTarget = {
  topicId: string;
  lessonId: string;
};

function parseActivityAt(iso: string | null | undefined): number | null {
  if (!iso) {
    return null;
  }
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

function compareStableTopicLesson(
  a: { topicSortOrder: number; lessonSortOrder: number },
  b: { topicSortOrder: number; lessonSortOrder: number },
): number {
  if (a.topicSortOrder !== b.topicSortOrder) {
    return a.topicSortOrder - b.topicSortOrder;
  }
  return a.lessonSortOrder - b.lessonSortOrder;
}

export function pickContinueLessonForTopic(
  lessons: ReadonlyArray<ContinueLearningLesson>,
  progress: ReadonlyArray<
    Pick<ContinueLearningProgressRow, 'lessonId' | 'status' | 'lastActivityAt'>
  >,
): ContinueLearningLesson | null {
  if (lessons.length === 0) {
    return null;
  }
  const byLesson = new Map(progress.map((row) => [row.lessonId, row]));
  const incomplete = [...lessons]
    .filter((lesson) => byLesson.get(lesson.id)?.status !== 'completed')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (incomplete.length === 0) {
    return null;
  }

  const withActivity = incomplete
    .map((lesson) => {
      const row = byLesson.get(lesson.id);
      const activityMs = parseActivityAt(row?.lastActivityAt ?? null);
      return { lesson, activityMs };
    })
    .filter(
      (item): item is { lesson: ContinueLearningLesson; activityMs: number } =>
        item.activityMs !== null,
    );

  if (withActivity.length > 0) {
    withActivity.sort((a, b) => {
      if (b.activityMs !== a.activityMs) {
        return b.activityMs - a.activityMs;
      }
      return a.lesson.sortOrder - b.lesson.sortOrder;
    });
    return withActivity[0]!.lesson;
  }

  return incomplete[0] ?? null;
}

export function pickGlobalContinueLearning(
  topics: ReadonlyArray<ContinueLearningTopic>,
  lessonsByTopicId: ReadonlyMap<string, ReadonlyArray<ContinueLearningLesson>>,
  progress: ReadonlyArray<ContinueLearningProgressRow>,
): ContinueLearningTarget | null {
  type Candidate = {
    topicId: string;
    lessonId: string;
    topicSortOrder: number;
    lessonSortOrder: number;
    activityMs: number | null;
  };

  const candidates: Candidate[] = [];
  for (const topic of [...topics].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const lessons = [...(lessonsByTopicId.get(topic.id) ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const topicProgress = progress.filter((row) => row.topicId === topic.id);
    for (const lesson of lessons) {
      const row = topicProgress.find((item) => item.lessonId === lesson.id);
      if (row?.status === 'completed') {
        continue;
      }
      candidates.push({
        topicId: topic.id,
        lessonId: lesson.id,
        topicSortOrder: topic.sortOrder,
        lessonSortOrder: lesson.sortOrder,
        activityMs: parseActivityAt(row?.lastActivityAt ?? null),
      });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  const withActivity = candidates.filter((item) => item.activityMs !== null);
  if (withActivity.length > 0) {
    withActivity.sort((a, b) => {
      if ((b.activityMs ?? 0) !== (a.activityMs ?? 0)) {
        return (b.activityMs ?? 0) - (a.activityMs ?? 0);
      }
      return compareStableTopicLesson(a, b);
    });
    const pick = withActivity[0]!;
    return { topicId: pick.topicId, lessonId: pick.lessonId };
  }

  candidates.sort(compareStableTopicLesson);
  const pick = candidates[0]!;
  return { topicId: pick.topicId, lessonId: pick.lessonId };
}
