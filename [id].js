export async function onRequestDelete({ params, env }) {
  const raw = await env.LMS_DB.get('logs');
  const logs = raw ? JSON.parse(raw) : [];
  const next = logs.filter((l) => l.id !== params.id);
  await env.LMS_DB.put('logs', JSON.stringify(next));
  return Response.json({ ok: true });
}
