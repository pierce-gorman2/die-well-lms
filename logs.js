const FOUNDERS = new Set(['pierce', 'kadon', 'luis']);

export async function onRequestGet({ env }) {
  const raw = await env.LMS_DB.get('logs');
  const logs = raw ? JSON.parse(raw) : [];
  return Response.json(logs);
}

export async function onRequestPost({ request, env }) {
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
  return Response.json(entry);
}
