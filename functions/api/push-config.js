export function onRequestGet({ env }) {
  if (!env.VAPID_PUBLIC_KEY) {
    return new Response(JSON.stringify({ error: 'Push service is not configured.' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }

  return new Response(JSON.stringify({ publicKey: env.VAPID_PUBLIC_KEY }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
