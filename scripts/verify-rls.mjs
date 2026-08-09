import { randomBytes } from 'node:crypto';

/**
 * Cross-user RLS checks via Auth Admin + PostgREST.
 * Creates two ephemeral users, asserts own vs other-row access, then deletes them.
 */
const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
const anon = process.env.SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.RLS_TEST_PASSWORD || `${randomBytes(24).toString('base64url')}Aa1!`;

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

    // app_config readable for authenticated
    {
      const { res } = await rest(userA.token, '/app_config?select=key&limit=1');
      assert(res.ok, `authenticated app_config select failed: ${res.status}`);
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
