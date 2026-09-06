const FOUNDERS = new Set(['pierce', 'kadon', 'luis']);

function json(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init && init.headers) },
  });
}

async function handleLogs(request, env) {
  if (request.method === 'GET') {
    const raw = await env.LMS_DB.get('logs');
    return json(raw ? JSON.parse(raw) : []);
  }

  if (request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const { founder, reps, note } = body || {};
    if (!FOUNDERS.has(founder)) {
      return new Response('Invalid founder', { status: 400 });
    }
    const repsNum = Number(reps);
    if (!Number.isFinite(repsNum) || repsNum <= 0 || repsNum > 10000) {
      return new Response('Invalid rep count', { status: 400 });
    }

    const raw = await env.LMS_DB.get('logs');
    const logs = raw ? JSON.parse(raw) : [];
    const entry = {
      id: crypto.randomUUID(),
      founder,
      reps: Math.round(repsNum),
      note: typeof note === 'string' && note.trim() ? note.trim().slice(0, 60) : null,
      loggedAt: new Date().toISOString(),
    };
    logs.push(entry);
    await env.LMS_DB.put('logs', JSON.stringify(logs));
    return json(entry);
  }

  return new Response('Method not allowed', { status: 405 });
}

async function handleLogById(request, env, id) {
  if (request.method === 'DELETE') {
    const raw = await env.LMS_DB.get('logs');
    const logs = raw ? JSON.parse(raw) : [];
    const next = logs.filter((l) => l.id !== id);
    await env.LMS_DB.put('logs', JSON.stringify(next));
    return json({ ok: true });
  }

  return new Response('Method not allowed', { status: 405 });
}

async function handleConfig(request, env) {
  if (request.method === 'GET') {
    const raw = await env.LMS_DB.get('config');
    return json(raw ? JSON.parse(raw) : { startDate: null });
  }

  if (request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const startDate = typeof body?.startDate === 'string' ? body.startDate.slice(0, 10) : null;
    const config = { startDate, updatedAt: new Date().toISOString() };
    await env.LMS_DB.put('config', JSON.stringify(config));
    return json(config);
  }

  return new Response('Method not allowed', { status: 405 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/logs') {
      return handleLogs(request, env);
    }
    const logMatch = url.pathname.match(/^\/api\/logs\/([^/]+)$/);
    if (logMatch) {
      return handleLogById(request, env, decodeURIComponent(logMatch[1]));
    }
    if (url.pathname === '/api/config') {
      return handleConfig(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
