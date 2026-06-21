const HORMUZ_API_BASE_URL = 'https://mhh.gic.mybluehost.me/wp-json/hlapi/v2';

const ROUTE_CACHE_TTL_SECONDS = {
  risk:       10 * 60,
  crisis:     10 * 60,
  traffic:    15 * 60,
  prices:     15 * 60,
  bypass:     30 * 60,
  dependency: 30 * 60
};

// KV entries expire automatically after 90 days
const HISTORY_TTL_SECONDS = 90 * 24 * 60 * 60;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders
    }
  });
}

function cacheKeyFor(requestUrl, route) {
  const url = new URL(requestUrl);
  const cacheUrl = new URL(url.origin);
  cacheUrl.pathname = `/${route}`;
  if (route === 'dependency') {
    cacheUrl.searchParams.set('country', url.searchParams.get('country') || '');
  }
  return new Request(cacheUrl.toString(), { method: 'GET' });
}

// Saves a fresh API response to KV with an ISO timestamp key.
// Runs via context.waitUntil so it never blocks the response.
// Silently skipped if the KV binding isn't configured yet.
async function saveToHistory(env, route, body, searchParams) {
  if (!env.HORMUZ_HISTORY) return;
  const timestamp = new Date().toISOString();
  const country = searchParams.get('country');
  const key = route === 'dependency' && country
    ? `${route}:${country}:${timestamp}`
    : `${route}:${timestamp}`;
  await env.HORMUZ_HISTORY.put(key, JSON.stringify({ timestamp, data: body }), {
    expirationTtl: HISTORY_TTL_SECONDS
  });
}

// GET /history/{route}[?limit=200][&country=US]
// Returns saved snapshots newest-first. Requires HORMUZ_HISTORY KV binding.
async function handleHistory(env, route, url) {
  if (!env.HORMUZ_HISTORY) {
    return jsonResponse(
      { error: 'History storage not configured. Bind a KV namespace to this worker as HORMUZ_HISTORY.' },
      503
    );
  }

  const limit  = Math.min(parseInt(url.searchParams.get('limit') || '200', 10), 1000);
  const country = url.searchParams.get('country') || 'US';
  const prefix = route === 'dependency' ? `${route}:${country}:` : `${route}:`;

  const list = await env.HORMUZ_HISTORY.list({ prefix, limit });
  const entries = await Promise.all(list.keys.map(k => env.HORMUZ_HISTORY.get(k.name, 'json')));

  const valid = entries.filter(Boolean);
  // KV list returns keys in ascending (oldest-first) order; reverse for newest-first
  valid.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return jsonResponse(
    { route, count: valid.length, truncated: !list.list_complete, entries: valid },
    200,
    { 'Cache-Control': 'no-store' }
  );
}

async function handleRequest(request, env, context) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);

  if (!env.HORMUZ_API_KEY) {
    return jsonResponse({ error: 'Proxy is missing the HORMUZ_API_KEY secret.' }, 500);
  }

  const url = new URL(request.url);
  const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/');

  // History route: /history/{route}
  if (parts[0] === 'history') {
    const route = parts[1];
    if (!route || !Object.prototype.hasOwnProperty.call(ROUTE_CACHE_TTL_SECONDS, route)) {
      return jsonResponse({ error: 'Unknown history endpoint.' }, 404);
    }
    return handleHistory(env, route, url);
  }

  // Live data route: /{route}
  const route = parts[0];
  if (!Object.prototype.hasOwnProperty.call(ROUTE_CACHE_TTL_SECONDS, route)) {
    return jsonResponse({ error: 'Unknown endpoint.' }, 404);
  }

  const upstreamUrl = new URL(`${HORMUZ_API_BASE_URL}/${route}`);
  if (route === 'dependency') {
    const country = url.searchParams.get('country');
    if (!country) return jsonResponse({ error: 'Missing required country query parameter.' }, 400);
    upstreamUrl.searchParams.set('country', country);
  }

  const ttl = ROUTE_CACHE_TTL_SECONDS[route];
  const cache = caches.default;
  const cacheKey = cacheKeyFor(request.url, route);
  const cached = await cache.match(cacheKey);
  if (cached) {
    const response = new Response(cached.body, cached);
    response.headers.set('X-Cache', 'HIT');
    return response;
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      headers: {
        Accept: 'application/json',
        'X-API-Key': env.HORMUZ_API_KEY
      },
      cf: { cacheTtl: ttl, cacheEverything: true }
    });

    const bodyText = await upstreamResponse.text();
    let body;
    try {
      body = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      body = { raw: bodyText };
    }

    if (!upstreamResponse.ok) {
      return jsonResponse({
        error: 'Hormuz API request failed.',
        status: upstreamResponse.status,
        details: body
      }, upstreamResponse.status >= 500 ? 502 : upstreamResponse.status);
    }

    const response = jsonResponse({ data: body }, 200, {
      'Cache-Control': `public, max-age=${ttl}`,
      'X-Cache': 'MISS'
    });

    // Edge cache + KV history write — both non-blocking
    context.waitUntil(Promise.all([
      cache.put(cacheKey, response.clone()),
      saveToHistory(env, route, body, url.searchParams)
    ]));

    return response;
  } catch (error) {
    return jsonResponse({ error: 'Unable to reach Hormuz API.', message: error.message }, 502);
  }
}

export default {
  fetch: handleRequest
};
