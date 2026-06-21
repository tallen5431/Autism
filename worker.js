const HORMUZ_API_BASE_URL = 'https://mhh.gic.mybluehost.me/wp-json/hlapi/v2';

const ONE_HOUR_SECONDS = 3600;
const ROUTE_CACHE_TTL_SECONDS = {
  risk: ONE_HOUR_SECONDS,
  crisis: ONE_HOUR_SECONDS,
  traffic: ONE_HOUR_SECONDS,
  prices: ONE_HOUR_SECONDS,
  bypass: ONE_HOUR_SECONDS,
  dependency: ONE_HOUR_SECONDS
};

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

async function handleRequest(request, env, context) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);

  if (!env.HORMUZ_API_KEY) {
    return jsonResponse({ error: 'Proxy is missing the HORMUZ_API_KEY secret.' }, 500);
  }

  const url = new URL(request.url);
  const route = url.pathname.replace(/^\/+|\/+$/g, '');
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
    } catch (error) {
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
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    return jsonResponse({ error: 'Unable to reach Hormuz API.', message: error.message }, 502);
  }
}

export default {
  fetch: handleRequest
};
