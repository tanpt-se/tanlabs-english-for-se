import { randomBytes, randomUUID } from 'node:crypto';

/**
 * Cross-user RLS checks via Auth Admin + PostgREST.
 * Creates two ephemeral users, asserts own vs other-row access, then deletes them.
 */
const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
const anon = process.env.SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.RLS_TEST_PASSWORD || `${randomBytes(24).toString('base64url')}Aa1!`;

function cryptoRandomUuid() {
  return randomUUID();
}

if (!url || !anon || !service) {
  console.error('Missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const stamp = Date.now();
const userA = { email: `ph1.rls.a.${stamp}@example.com`, password, id: null, token: null };
const userB = { email: `ph1.rls.b.${stamp}@example.com`, password, id: null, token: null };

function assert(cond, msg) {
  if (!cond) {
    throw new Error(msg);
  }
}

async function admin(path, init = {}) {
  const res = await fetch(`${url}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

async function rest(userToken, path, init = {}) {
  const res = await fetch(`${url}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: anon,
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
      Prefer: init.prefer || 'return=representation',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

async function signIn(email) {
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  assert(res.ok && body.access_token, `signIn failed for ${email}: ${JSON.stringify(body)}`);
  return body.access_token;
}

async function createUser(user) {
  const { res, body } = await admin('/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true,
    }),
  });
  assert(res.ok && body?.id, `createUser ${user.email}: ${JSON.stringify(body)}`);
  user.id = body.id;
  user.token = await signIn(user.email);
}

async function deleteUser(user) {
  if (!user.id) {
    return;
  }
  const { res, body } = await admin(`/admin/users/${user.id}`, { method: 'DELETE' });
  assert(res.ok, `deleteUser ${user.email}: ${res.status} ${JSON.stringify(body)}`);
}

async function main() {
  console.log('RLS verify against', url);
  try {
    await createUser(userA);
    await createUser(userB);

    // Own profile upsert / select
    {
      const { res, body } = await rest(userA.token, '/profiles', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates,return=representation',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({
          id: userA.id,
          display_name: 'User A',
          english_level: 'B1',
        }),
      });
      assert(res.ok, `A upsert own profile failed: ${res.status} ${JSON.stringify(body)}`);
    }
    {
      const { res, body } = await rest(userB.token, '/profiles', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({
          id: userB.id,
          display_name: 'User B',
          english_level: 'A2',
        }),
      });
      assert(res.ok, `B upsert own profile failed: ${res.status} ${JSON.stringify(body)}`);
    }
    {
      const { res, body } = await rest(userA.token, `/profiles?id=eq.${userA.id}&select=*`);
      assert(res.ok && Array.isArray(body) && body.length === 1, 'A cannot read own profile');
    }
    {
      const { res, body } = await rest(userA.token, `/profiles?id=eq.${userB.id}&select=*`);
      assert(res.ok && Array.isArray(body) && body.length === 0, 'A must not read B profile');
    }
    {
      const { res } = await rest(userA.token, `/profiles?id=eq.${userB.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ display_name: 'Hacked' }),
      });
      // Update of zero rows still often returns 204/200; verify by re-read as B.
      assert(res.status < 500, `A update B profile unexpected ${res.status}`);
      const check = await rest(userB.token, `/profiles?id=eq.${userB.id}&select=display_name`);
      assert(check.body?.[0]?.display_name === 'User B', 'A was able to mutate B profile');
    }
    {
      const { res } = await rest(userA.token, `/profiles?id=eq.${userA.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ display_name: 'x'.repeat(41) }),
      });
      assert(!res.ok, 'Profile display-name length constraint is missing');
    }

    for (const user of [userA, userB]) {
      const { res, body } = await rest(user.token, '/notification_settings', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({ user_id: user.id, enabled: true }),
      });
      assert(res.ok, `Notification setting setup failed: ${JSON.stringify(body)}`);
    }

    // Devices
    const tokenA = `fcm-a-${stamp}`;
    const tokenB = `fcm-b-${stamp}`;
    {
      const { res, body } = await rest(userA.token, '/user_devices', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userA.id,
          fcm_token: tokenA,
          platform: 'android',
          is_active: true,
        }),
      });
      assert(res.ok, `A insert device failed: ${JSON.stringify(body)}`);
    }
    {
      const { res, body } = await rest(userA.token, '/user_devices', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userB.id,
          fcm_token: tokenB,
          platform: 'android',
          is_active: true,
        }),
      });
      assert(!res.ok || (Array.isArray(body) && body.length === 0), 'A must not insert B device');
    }
    {
      const { res, body } = await rest(userA.token, `/user_devices?fcm_token=eq.${tokenA}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: false }),
      });
      assert(res.ok, `A update own device failed: ${JSON.stringify(body)}`);
    }
    {
      const { res, body } = await rest(userB.token, '/rpc/claim_device_token', {
        method: 'POST',
        body: JSON.stringify({ p_token: tokenA, p_platform: 'android' }),
      });
      assert(res.ok, `B claim device token failed: ${JSON.stringify(body)}`);
      const previousOwner = await rest(
        userA.token,
        `/user_devices?fcm_token=eq.${tokenA}&select=is_active`,
      );
      const currentOwner = await rest(
        userB.token,
        `/user_devices?fcm_token=eq.${tokenA}&select=is_active`,
      );
      assert(previousOwner.body?.[0]?.is_active === false, 'Claim did not deactivate prior owner');
      assert(currentOwner.body?.[0]?.is_active === true, 'Claim did not activate current owner');
    }

    {
      const { res, body } = await rest(userA.token, '/notification_settings', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({ user_id: userA.id, enabled: true }),
      });
      assert(res.ok, `A notification setting failed: ${JSON.stringify(body)}`);
    }
    {
      const { res } = await rest(userB.token, `/notification_settings?user_id=eq.${userA.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: false }),
      });
      assert(res.status < 500, `B notification cross-update unexpected ${res.status}`);
      const check = await rest(
        userA.token,
        `/notification_settings?user_id=eq.${userA.id}&select=enabled`,
      );
      assert(check.body?.[0]?.enabled === true, 'B changed A notification setting');
    }

    // app_config readable for authenticated; not writable by clients
    {
      const { res } = await rest(userA.token, '/app_config?select=key&limit=1');
      assert(res.ok, `authenticated app_config select failed: ${res.status}`);
    }
    {
      const { res } = await rest(userA.token, '/app_config', {
        method: 'POST',
        body: JSON.stringify({ key: `ph1_rls_probe_${stamp}`, value: true }),
      });
      assert(
        res.status === 401 || res.status === 403 || res.status === 42501 || !res.ok,
        `authenticated app_config insert unexpectedly allowed: ${res.status}`,
      );
    }
    {
      const anonymousProfiles = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      });
      const anonymousBody = await anonymousProfiles.json().catch(() => null);
      assert(
        Array.isArray(anonymousBody) && anonymousBody.length === 0,
        `anonymous profiles select leaked rows: ${JSON.stringify(anonymousBody)}`,
      );
    }
    {
      const anonymousInsert = await fetch(`${url}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          apikey: anon,
          Authorization: `Bearer ${anon}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id: '00000000-0000-4000-8000-000000000000',
          display_name: 'anon',
          english_level: 'A1',
        }),
      });
      assert(
        anonymousInsert.status === 401 ||
          anonymousInsert.status === 403 ||
          anonymousInsert.status === 42501 ||
          !anonymousInsert.ok,
        `anonymous profiles insert unexpectedly allowed: ${anonymousInsert.status}`,
      );
    }

    // Grammar content + progress RLS (PH2)
    {
      const topics = await rest(
        userA.token,
        '/grammar_topics?select=id,slug&published=eq.true&limit=1',
      );
      assert(
        topics.res.ok && Array.isArray(topics.body) && topics.body.length >= 1,
        `A cannot read published grammar topics: ${JSON.stringify(topics.body)}`,
      );
      const topicId = topics.body[0].id;
      const lessons = await rest(
        userA.token,
        `/grammar_lessons?topic_id=eq.${topicId}&published=eq.true&select=id&limit=1`,
      );
      assert(
        lessons.res.ok && Array.isArray(lessons.body) && lessons.body.length >= 1,
        `A cannot read published grammar lessons: ${JSON.stringify(lessons.body)}`,
      );
      const lessonId = lessons.body[0].id;
      const exercises = await rest(
        userA.token,
        `/grammar_exercises?lesson_id=eq.${lessonId}&published=eq.true&select=id&limit=1`,
      );
      assert(
        exercises.res.ok && Array.isArray(exercises.body),
        `A cannot read published grammar exercises: ${JSON.stringify(exercises.body)}`,
      );

      const insertTopic = await rest(userA.token, '/grammar_topics', {
        method: 'POST',
        body: JSON.stringify({
          slug: `rls-probe-${stamp}`,
          title: 'probe',
          description: 'probe',
          sort_order: 9999,
          published: true,
        }),
      });
      assert(!insertTopic.res.ok, 'A must not insert grammar_topics');

      const insertProgress = await rest(userA.token, '/user_grammar_progress', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userA.id,
          topic_id: topicId,
          lesson_id: lessonId,
          status: 'in_progress',
          best_score: 10,
          last_score: 10,
        }),
      });
      assert(!insertProgress.res.ok, 'A must not directly insert user_grammar_progress');

      const insertAttempt = await rest(userA.token, '/grammar_attempts', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userA.id,
          client_attempt_id: cryptoRandomUuid(),
          topic_id: topicId,
          lesson_id: lessonId,
          content_revision: 1,
          correct_count: 1,
          total_count: 1,
          score: 100,
          answers: [],
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        }),
      });
      assert(!insertAttempt.res.ok, 'A must not directly insert grammar_attempts');

      const attemptId = cryptoRandomUuid();
      const rpcOk = await rest(userA.token, '/rpc/complete_grammar_attempt', {
        method: 'POST',
        body: JSON.stringify({
          p_client_attempt_id: attemptId,
          p_topic_id: topicId,
          p_lesson_id: lessonId,
          p_content_revision: 1,
          p_correct_count: 1,
          p_total_count: 1,
          p_score: 100,
          p_answers: [{ exerciseId: 'x', correct: true, selectedIds: [], skipped: false }],
          p_started_at: new Date().toISOString(),
          p_completed_at: new Date().toISOString(),
        }),
      });
      assert(rpcOk.res.ok, `complete_grammar_attempt failed: ${JSON.stringify(rpcOk.body)}`);

      const rpcDup = await rest(userA.token, '/rpc/complete_grammar_attempt', {
        method: 'POST',
        body: JSON.stringify({
          p_client_attempt_id: attemptId,
          p_topic_id: topicId,
          p_lesson_id: lessonId,
          p_content_revision: 1,
          p_correct_count: 0,
          p_total_count: 1,
          p_score: 0,
          p_answers: [{ exerciseId: 'x', correct: false, selectedIds: [], skipped: true }],
          p_started_at: new Date().toISOString(),
          p_completed_at: new Date().toISOString(),
        }),
      });
      assert(
        rpcDup.res.ok,
        `idempotent complete_grammar_attempt failed: ${JSON.stringify(rpcDup.body)}`,
      );
      assert(
        rpcDup.body?.score === 100 || rpcDup.body?.[0]?.score === 100,
        'idempotent RPC must keep first score',
      );

      const ownProgress = await rest(
        userA.token,
        `/user_grammar_progress?user_id=eq.${userA.id}&select=lesson_id,best_score`,
      );
      assert(
        ownProgress.res.ok && Array.isArray(ownProgress.body) && ownProgress.body.length >= 1,
        'A cannot read own grammar progress',
      );
      const crossProgress = await rest(
        userB.token,
        `/user_grammar_progress?user_id=eq.${userA.id}&select=lesson_id`,
      );
      assert(
        crossProgress.res.ok &&
          Array.isArray(crossProgress.body) &&
          crossProgress.body.length === 0,
        'B must not read A grammar progress',
      );
      const crossAttempts = await rest(
        userB.token,
        `/grammar_attempts?user_id=eq.${userA.id}&select=id`,
      );
      assert(
        crossAttempts.res.ok &&
          Array.isArray(crossAttempts.body) &&
          crossAttempts.body.length === 0,
        'B must not read A grammar attempts',
      );
    }

    // Vocabulary content + progress RLS (PH3)
    {
      const situations = await rest(
        userA.token,
        '/vocabulary_situations?select=id,slug&published=eq.true&limit=1',
      );
      assert(
        situations.res.ok && Array.isArray(situations.body) && situations.body.length >= 1,
        `A cannot read published vocabulary situations: ${JSON.stringify(situations.body)}`,
      );
      const situationId = situations.body[0].id;
      const items = await rest(
        userA.token,
        `/vocabulary_items?situation_id=eq.${situationId}&published=eq.true&select=id&limit=1`,
      );
      assert(
        items.res.ok && Array.isArray(items.body) && items.body.length >= 1,
        `A cannot read published vocabulary items: ${JSON.stringify(items.body)}`,
      );
      const itemId = items.body[0].id;
      const exercises = await rest(
        userA.token,
        `/vocabulary_exercises?situation_id=eq.${situationId}&published=eq.true&select=id&limit=1`,
      );
      assert(
        exercises.res.ok && Array.isArray(exercises.body),
        `A cannot read published vocabulary exercises: ${JSON.stringify(exercises.body)}`,
      );

      const insertSituation = await rest(userA.token, '/vocabulary_situations', {
        method: 'POST',
        body: JSON.stringify({
          slug: `rls-vocab-${stamp}`,
          title: 'probe',
          description: 'probe',
          sort_order: 9999,
          published: true,
        }),
      });
      assert(!insertSituation.res.ok, 'A must not insert vocabulary_situations');

      const insertProgress = await rest(userA.token, '/user_vocabulary_progress', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userA.id,
          situation_id: situationId,
          item_id: itemId,
          correct_count: 1,
          incorrect_count: 0,
          last_result: true,
        }),
      });
      assert(!insertProgress.res.ok, 'A must not directly insert user_vocabulary_progress');

      const insertAttempt = await rest(userA.token, '/vocabulary_attempts', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userA.id,
          client_attempt_id: cryptoRandomUuid(),
          situation_id: situationId,
          content_revision: 1,
          correct_count: 1,
          total_count: 1,
          score: 100,
          item_results: [{ itemId, correct: true }],
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        }),
      });
      assert(!insertAttempt.res.ok, 'A must not directly insert vocabulary_attempts');

      const attemptId = cryptoRandomUuid();
      const rpcOk = await rest(userA.token, '/rpc/complete_vocabulary_attempt', {
        method: 'POST',
        body: JSON.stringify({
          p_client_attempt_id: attemptId,
          p_situation_id: situationId,
          p_content_revision: 1,
          p_correct_count: 1,
          p_total_count: 1,
          p_score: 100,
          p_item_results: [{ itemId, correct: true }],
          p_started_at: new Date().toISOString(),
          p_completed_at: new Date().toISOString(),
        }),
      });
      assert(rpcOk.res.ok, `complete_vocabulary_attempt failed: ${JSON.stringify(rpcOk.body)}`);

      const rpcDup = await rest(userA.token, '/rpc/complete_vocabulary_attempt', {
        method: 'POST',
        body: JSON.stringify({
          p_client_attempt_id: attemptId,
          p_situation_id: situationId,
          p_content_revision: 1,
          p_correct_count: 0,
          p_total_count: 1,
          p_score: 0,
          p_item_results: [{ itemId, correct: false }],
          p_started_at: new Date().toISOString(),
          p_completed_at: new Date().toISOString(),
        }),
      });
      assert(
        rpcDup.res.ok,
        `idempotent complete_vocabulary_attempt failed: ${JSON.stringify(rpcDup.body)}`,
      );
      assert(
        rpcDup.body?.score === 100 || rpcDup.body?.[0]?.score === 100,
        'idempotent vocabulary RPC must keep first score',
      );

      const ownProgress = await rest(
        userA.token,
        `/user_vocabulary_progress?user_id=eq.${userA.id}&select=item_id,correct_count`,
      );
      assert(
        ownProgress.res.ok && Array.isArray(ownProgress.body) && ownProgress.body.length >= 1,
        'A cannot read own vocabulary progress',
      );
      const crossProgress = await rest(
        userB.token,
        `/user_vocabulary_progress?user_id=eq.${userA.id}&select=item_id`,
      );
      assert(
        crossProgress.res.ok &&
          Array.isArray(crossProgress.body) &&
          crossProgress.body.length === 0,
        'B must not read A vocabulary progress',
      );
    }

    console.log('RLS verification PASSED');
  } finally {
    const cleanup = await Promise.allSettled([deleteUser(userA), deleteUser(userB)]);
    const failures = cleanup.filter((result) => result.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(
        `RLS user cleanup failed: ${failures
          .map((result) => (result.status === 'rejected' ? String(result.reason) : ''))
          .join('; ')}`,
      );
    }
  }
}

main().catch((err) => {
  console.error('RLS verification FAILED:', err.message || err);
  process.exit(1);
});
