import test from 'tape'
import { Headers, Request, Response } from 'node-fetch'
import cors from '../dist/cors.js'

// url to create the test Request object easier
const url = new URL('https://vercel.com')

// Add Web APIs to the global scope so dist/cors.js can use them
global.Headers = Headers
global.Response = Response

test('should not alter options configuration object', async (t) => {
  const options = Object.freeze({
    origin: 'https://vercel.com',
  })

  try {
    await cors(new Request(url), new Response(null), options)
  } catch (e) {
    t.fail('options object was mutated')
  }
})

test('should return 204 on preflight request', async (t) => {
  const res = await cors(
    new Request(url, { method: 'OPTIONS' }),
    new Response(null)
  )
  t.equal(res.status, 204, 'response status is 204')
})

test('should allow preflight with custom status code', async (t) => {
  const res = await cors(
    new Request(url, { method: 'OPTIONS' }),
    new Response(null),
    { optionsSuccessStatus: 200 }
  )
  t.equal(res.status, 200, 'response status is 200')
})

test('should not return a new response if preflightContinue is true', async (t) => {
  const req = new Request(url, { method: 'OPTIONS' })
  const res = new Response(null)
  const corsRes = await cors(req, res, { preflightContinue: true })

  t.equal(res, corsRes, 'the response object did not change')
})

test('should add Content-Length to response headers', async (t) => {
  const req = new Request(url, { method: 'OPTIONS' })
  const res = new Response(null)
  await cors(req, res)

  t.equal(res.headers.get('Content-Length'), '0', 'Content-Length is 0')
})

test('should allow any origin with default options', async (t) => {
  const req = new Request(url)
  const res = new Response('{}', {
    headers: { 'Content-Type': 'application/json' },
  })
  await cors(req, res)

  t.deepEqual(
    Object.fromEntries(res.headers),
    {
      'access-control-allow-origin': '*',
      'content-type': 'application/json',
    },
    'response headers are correct'
  )
})

test('should allow any origin and method for OPTIONS request with default options', async (t) => {
  const req = new Request(url, { method: 'OPTIONS' })
  const res = new Response(null)
  const corsRes = await cors(req, res)

  t.equal(corsRes.status, 204, 'response status is 204')
  t.deepEqual(
    Object.fromEntries(corsRes.headers),
    {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'content-length': '0',
      vary: 'Access-Control-Request-Headers',
    },
    'response headers are correct'
  )
})

test('can override default options', async (t) => {
  const req = new Request(url, { method: 'OPTIONS' })
  const res = new Response(null)
  await cors(req, res, {
    origin: 'https://vercel.com',
    methods: ['FOO', 'bar'],
    allowedHeaders: ['FIZZ', 'buzz'],
    credentials: true,
    maxAge: 123,
  })

  t.deepEqual(
    Object.fromEntries(res.headers),
    {
      'access-control-allow-origin': 'https://vercel.com',
      'access-control-allow-methods': 'FOO,bar',
      'access-control-allow-headers': 'FIZZ,buzz',
      'access-control-allow-credentials': 'true',
      'access-control-max-age': '123',
      'content-length': '0',
      vary: 'Origin',
    },
    'response headers are correct'
  )
})

test('should match request origin against regexp', async (t) => {
  const req = new Request(url, { headers: { origin: 'https://vercel.com' } })
  const res = new Response(null)
  await cors(req, res, { origin: /vercel\.com$/ })

  t.deepEqual(
    Object.fromEntries(res.headers),
    {
      'access-control-allow-origin': 'https://vercel.com',
      vary: 'Origin',
    },
    'response headers are correct'
  )
})

test('should match request origin against array of origins', async (t) => {
  const req = new Request(url, { headers: { origin: 'https://vercel.com' } })
  const res = new Response(null)
  await cors(req, res, { origin: [/foo\.com$/, 'https://vercel.com'] })

  t.deepEqual(
    Object.fromEntries(res.headers),
    {
      'access-control-allow-origin': 'https://vercel.com',
      vary: 'Origin',
    },
    'response headers are correct'
  )
})

test('should not match request origin against array of invalid origins', async (t) => {
  const req = new Request(url, { headers: { origin: 'https://vercel.com' } })
  const res = new Response(null)
  await cors(req, res, { origin: [/foo\.com$/, 'https://notvercel.com'] })

  t.deepEqual(
    Object.fromEntries(res.headers),
    { vary: 'Origin' },
    'response headers are correct'
  )
})

test('should disable cors if origin is false', async (t) => {
  const req = new Request(url)
  const res = new Response(null)
  await cors(req, res, { origin: false })

  t.deepEqual(
    Object.fromEntries(res.headers),
    {},
    'response headers are correct'
  )
})

test('can override origin', async (t) => {
  const req = new Request(url, { headers: { origin: 'https://notvercel.com' } })
  const res = new Response(null)
  await cors(req, res, { origin: 'https://vercel.com' })

  t.deepEqual(
    Object.fromEntries(res.headers),
    {
      'access-control-allow-origin': 'https://vercel.com',
      vary: 'Origin',
    },
    'response headers are correct'
  )
})

test('should append Vary header to existing Vary header', async (t) => {
  const req = new Request(url)
  const res = new Response(null, { headers: { Vary: 'Foo' } })
  await cors(req, res, { origin: 'https://vercel.com' })

  t.deepEqual(
    Object.fromEntries(res.headers),
    {
      'access-control-allow-origin': 'https://vercel.com',
      vary: 'Foo, Origin',
    },
    'response headers are correct'
  )
})

test('should reflect request origin if origin is set to true', async (t) => {
  const req = new Request(url, { headers: { origin: 'https://vercel.com' } })
  const res = new Response(null)
  await cors(req, res, { origin: true })

  t.deepEqual(
    Object.fromEntries(res.headers),
    {
      'access-control-allow-origin': 'https://vercel.com',
      vary: 'Origin',
    },
    'response headers are correct'
  )
})

test('should reflect request origin if origin function returns true', async (t) => {
  const req = new Request(url, { headers: { origin: 'https://vercel.com' } })
  const res = new Response(null)
  await cors(req, res, { origin: async () => true })

  t.deepEqual(
    Object.fromEntries(res.headers),
    {
      'access-control-allow-origin': 'https://vercel.com',
      vary: 'Origin',
    },
    'response headers are correct'
  )
})

test('should not allow request origin if origin function returns false', async (t) => {
  const req = new Request(url, { headers: { origin: 'https://vercel.com' } })
  const res = new Response(null)
  await cors(req, res, { origin: async () => false })

  t.deepEqual(
    Object.fromEntries(res.headers),
    {},
    'response headers are correct'
  )
})

test('should not override origin function', async (t) => {
  let req = new Request(url, { headers: { origin: 'https://vercel.com' } })
  let res = new Response(null)
  const options = { origin: async (origin) => origin === 'https://vercel.com' }
  await cors(req, res, options)

  t.deepEqual(
    Object.fromEntries(res.headers),
    {
      'access-control-allow-origin': 'https://vercel.com',
      vary: 'Origin',
    },
    'first response headers are correct'
  )

  req = new Request(url, { headers: { origin: 'https://notvercel.com' } })
  res = new Response(null)
  await cors(req, res, options)

  t.deepEqual(
    Object.fromEntries(res.headers),
    {},
    'second response headers are correct'
  )
})

test('should be able to override allowed methods', async (t) => {
  const req = new Request(url, { method: 'OPTIONS' })
  const res = new Response(null)
  await cors(req, res, { methods: ['method1', 'method2'] })

  t.deepEqual(
    Object.fromEntries(res.headers),
    {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'method1,method2',
      'content-length': '0',
      vary: 'Access-Control-Request-Headers',
    },
    'response headers are correct'
  )
})

test('should be able to use an array of allowed headers', async (t) => {
  const req = new Request(url, { method: 'OPTIONS' })
  const res = new Response(null)
  await cors(req, res, { allowedHeaders: ['header1', 'header2'] })

  t.deepEqual(
    Object.fromEntries(res.headers),
    {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'access-control-allow-headers': 'header1,header2',
      'content-length': '0',
    },
    'response headers are correct'
  )
})

test('should be able to set allowed headers as a string', async (t) => {
  const req = new Request(url, { method: 'OPTIONS' })
  const res = new Response(null)
  await cors(req, res, { allowedHeaders: 'header1,header2' })

  t.deepEqual(
    Object.fromEntries(res.headers),
    {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'access-control-allow-headers': 'header1,header2',
      'content-length': '0',
    },
    'response headers are correct'
  )
})

test('should not send allowed headers if set to empty array or empty string', async (t) => {
  let req = new Request(url, { method: 'OPTIONS' })
  let res = new Response(null)
  await cors(req, res, { allowedHeaders: [] })

  const expected = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'content-length': '0',
  }

  t.deepEqual(
    Object.fromEntries(res.headers),
    expected,
    'response headers for empty array are correct'
  )

  req = new Request(url, { method: 'OPTIONS' })
  res = new Response(null)
  await cors(req, res, { allowedHeaders: '' })

  t.deepEqual(
    Object.fromEntries(res.headers),
    expected,
    'response headers for empty string are correct'
  )
})

test('should default to request allowed headers if no allowedHeaders is not set', async (t) => {
  const req = new Request(url, {
    method: 'OPTIONS',
    headers: { 'access-control-request-headers': 'x-header-1, x-header-2' },
  })
  const res = new Response(null)
  await cors(req, res)

  t.deepEqual(
    Object.fromEntries(res.headers),
    {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'access-control-allow-headers': 'x-header-1, x-header-2',
      'content-length': '0',
      vary: 'Access-Control-Request-Headers',
    },
    'response headers are correct'
  )
})

test('should be able to use an array of exposed headers', async (t) => {
  const req = new Request(url, { method: 'OPTIONS' })
  const res = new Response(null)
  await cors(req, res, { exposedHeaders: ['custom-header1', 'custom-header2'] })

  t.deepEqual(
    Object.fromEntries(res.headers),
    {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'access-control-expose-headers': 'custom-header1,custom-header2',
      'content-length': '0',
      vary: 'Access-Control-Request-Headers',
    },
    'response headers are correct'
  )
})

test('should be able to set exposed headers as a string', async (t) => {
  const req = new Request(url, { method: 'OPTIONS' })
  const res = new Response(null)
  await cors(req, res, { exposedHeaders: 'custom-header1,custom-header2' })

  t.deepEqual(
    Object.fromEntries(res.headers),
    {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'access-control-expose-headers': 'custom-header1,custom-header2',
      'content-length': '0',
      vary: 'Access-Control-Request-Headers',
    },
    'response headers are correct'
  )
})

test('should not send exposed headers if set to empty array or empty string', async (t) => {
  let req = new Request(url, { method: 'OPTIONS' })
  let res = new Response(null)
  await cors(req, res, { exposedHeaders: [] })

  const expected = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'content-length': '0',
    vary: 'Access-Control-Request-Headers',
  }

  t.deepEqual(
    Object.fromEntries(res.headers),
    expected,
    'response headers for empty array are correct'
  )

  req = new Request(url, { method: 'OPTIONS' })
  res = new Response(null)
  await cors(req, res, { exposedHeaders: '' })

  t.deepEqual(
    Object.fromEntries(res.headers),
    expected,
    'response headers for empty string are correct'
  )
})

test('should include maxAge if set to 0', async (t) => {
  const req = new Request(url, { method: 'OPTIONS' })
  const res = new Response(null)
  await cors(req, res, { maxAge: 0 })

  t.deepEqual(
    Object.fromEntries(res.headers),
    {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'access-control-max-age': '0',
      'content-length': '0',
      vary: 'Access-Control-Request-Headers',
    },
    'response headers are correct'
  )
})

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
