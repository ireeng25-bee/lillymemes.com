const textEncoder = new TextEncoder();

function base64UrlEncode(value) {
  const bytes = value instanceof Uint8Array ? value : textEncoder.encode(value);
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function pemToBytes(pem) {
  return base64UrlDecode(pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '').replace(/\+/g, '-').replace(/\//g, '_'));
}

function uint32Bytes(value) {
  return new Uint8Array([
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255
  ]);
}

function concatBytes(...arrays) {
  const result = new Uint8Array(arrays.reduce((total, array) => total + array.length, 0));
  let offset = 0;
  arrays.forEach(array => {
    result.set(array, offset);
    offset += array.length;
  });
  return result;
}

async function hmacKey(keyBytes) {
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function hkdfExtract(salt, inputKeyMaterial) {
  const key = await hmacKey(salt);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, inputKeyMaterial));
}

async function hkdfExpand(prk, info, length) {
  const key = await hmacKey(prk);
  const infoBytes = typeof info === 'string' ? textEncoder.encode(info) : info;
  const chunks = [];
  let outputLength = 0;
  let previous = new Uint8Array();
  let counter = 1;
  while (outputLength < length) {
    previous = new Uint8Array(await crypto.subtle.sign('HMAC', key, concatBytes(previous, infoBytes, new Uint8Array([counter]))));
    chunks.push(previous);
    outputLength += previous.length;
    counter += 1;
  }
  return concatBytes(...chunks).slice(0, length);
}

function derSignatureToJose(signature) {
  if (signature.length === 64) return signature;
  let offset = 2;
  if (signature[1] & 0x80) offset += signature[1] & 0x7f;
  if (signature[offset] !== 0x02) throw new Error('Invalid VAPID signature');
  const rLength = signature[offset + 1];
  const rStart = offset + 2;
  const sMarker = rStart + rLength;
  const sLength = signature[sMarker + 1];
  const sStart = sMarker + 2;
  const result = new Uint8Array(64);
  result.set(signature.slice(Math.max(rStart, sStart - rLength), sMarker).slice(-32), 0);
  result.set(signature.slice(Math.max(sStart, sStart + sLength - 32), sStart + sLength).slice(-32), 32);
  return result;
}

async function createVapidToken(endpoint, env) {
  const endpointUrl = new URL(endpoint);
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const payload = base64UrlEncode(JSON.stringify({
    aud: endpointUrl.origin,
    exp: now + 43200,
    sub: env.VAPID_SUBJECT || 'mailto:admin@lillymemes.com'
  }));
  const signingInput = textEncoder.encode(`${header}.${payload}`);
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToBytes(env.VAPID_PRIVATE_KEY_PKCS8),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const signature = new Uint8Array(await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    signingInput
  ));
  return `${header}.${payload}.${base64UrlEncode(derSignatureToJose(signature))}`;
}

async function encryptPushPayload(subscription, payload) {
  const clientPublic = base64UrlDecode(subscription.p256dh);
  const authSecret = base64UrlDecode(subscription.auth);
  const clientPublicKey = await crypto.subtle.importKey(
    'raw',
    clientPublic,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  const serverKeys = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  const serverPublic = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeys.publicKey));
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    serverKeys.privateKey,
    256
  ));
  const authInfo = concatBytes(textEncoder.encode('WebPush: info\0'), clientPublic, serverPublic);
  const authPrk = await hkdfExtract(authSecret, sharedSecret);
  const ikm = await hkdfExpand(authPrk, authInfo, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hkdfExtract(salt, ikm);
  const cek = await hkdfExpand(prk, 'Content-Encoding: aes128gcm\0', 16);
  const nonce = await hkdfExpand(prk, 'Content-Encoding: nonce\0', 12);
  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const paddedPayload = concatBytes(textEncoder.encode(JSON.stringify(payload)), new Uint8Array([2]));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce, tagLength: 128 },
    aesKey,
    paddedPayload
  ));
  const recordSize = uint32Bytes(4096);
  const body = concatBytes(salt, recordSize, new Uint8Array([serverPublic.length]), serverPublic, ciphertext);
  return { body, serverPublic };
}

async function supabaseRequest(env, path, options = {}) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY_PKCS8) {
    return new Response(JSON.stringify({ error: 'Push service is not configured.' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) return new Response('Unauthorized', { status: 401 });
  const accessToken = authorization.slice(7);
  const userResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${accessToken}` }
  });
  if (!userResponse.ok) return new Response('Unauthorized', { status: 401 });
  const user = await userResponse.json();

  const adminResponse = await supabaseRequest(env, `profiles?id=eq.${encodeURIComponent(user.id)}&select=role`);
  const adminProfiles = await adminResponse.json();
  if (!adminResponse.ok || !adminProfiles[0] || adminProfiles[0].role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 });
  }

  const requestBody = await request.json().catch(() => null);
  const postId = requestBody && requestBody.postId;
  if (!postId) return new Response('postId is required', { status: 400 });

  const postResponse = await supabaseRequest(env, `posts?id=eq.${encodeURIComponent(postId)}&select=id,caption`);
  const posts = await postResponse.json();
  if (!postResponse.ok || !posts[0]) return new Response('Post not found', { status: 404 });

  const subscriptionsResponse = await supabaseRequest(env, 'push_subscriptions?enabled=eq.true&new_meme_notifications=eq.true&select=id,endpoint,p256dh,auth');
  const subscriptions = await subscriptionsResponse.json();
  if (!subscriptionsResponse.ok) return new Response('Could not load subscriptions', { status: 502 });

  let sent = 0;
  for (const subscription of subscriptions) {
    const deliveryResponse = await supabaseRequest(env, 'push_notification_deliveries', {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
      body: JSON.stringify({ post_id: postId, subscription_id: subscription.id })
    });
    if (deliveryResponse.status === 409) continue;
    if (!deliveryResponse.ok) continue;
    const deliveryRows = await deliveryResponse.json().catch(() => []);
    if (!Array.isArray(deliveryRows) || deliveryRows.length === 0) continue;

    const payload = {
      title: '😂 New Meme on LILLY MEMES',
      body: 'A new meme has just been posted. Tap to view it!',
      icon: './assets/appicon.png',
      badge: './assets/appicon.png',
      data: { url: `./index.html#meme-${postId}` }
    };
    const encrypted = await encryptPushPayload(subscription, payload);
    const vapidToken = await createVapidToken(subscription.endpoint, env);
    const pushResponse = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `vapid t=${vapidToken}, k=${env.VAPID_PUBLIC_KEY}`,
        TTL: '86400',
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream'
      },
      body: encrypted.body
    });
    if (pushResponse.ok || pushResponse.status === 201) sent += 1;
    if (!pushResponse.ok && pushResponse.status !== 201) {
      await supabaseRequest(env, `push_notification_deliveries?post_id=eq.${encodeURIComponent(postId)}&subscription_id=eq.${encodeURIComponent(subscription.id)}`, {
        method: 'DELETE'
      });
    }
    if (pushResponse.status === 404 || pushResponse.status === 410) {
      await supabaseRequest(env, `push_subscriptions?id=eq.${encodeURIComponent(subscription.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: false, updated_at: new Date().toISOString() })
      });
    }
  }

  return new Response(JSON.stringify({ sent }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
