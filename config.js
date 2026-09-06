export async function onRequestGet({ env }) {
  const raw = await env.LMS_DB.get('config');
  const config = raw ? JSON.parse(raw) : { startDate: null };
  return Response.json(config);
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const startDate = typeof body?.startDate === 'string' ? body.startDate.slice(0, 10) : null;
  const config = { startDate, updatedAt: new Date().toISOString() };
  await env.LMS_DB.put('config', JSON.stringify(config));
  return Response.json(config);
}
