# Edge CORS

Enables CORS at the edge, works for [Vercel Edge Functions](https://vercel.com/features/edge-functions) (With the recently announced [Next.js Middleware](https://nextjs.org/blog/next-12#introducing-middleware)), [Deno](https://deno.com/), [Cloudflare Workers](https://developers.cloudflare.com/), and any environment with [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API) support, specifically the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).

![npm (tag)](https://img.shields.io/npm/v/edge-cors/latest)
[![nest.land](https://nest.land/badge.svg)](https://nest.land/package/edge_cors)

This module is a modified version of [expressjs/cors](https://github.com/expressjs/cors), which works for Node.js and should be your way to go if you're looking for Node.js support.

## Installation

The module is available in npm, and as a Deno module. To install it from npm:

```bash
npm i edge-cors
```

[Skypack](https://www.skypack.dev/view/edge-cors) is also an option, and works with [Next.js URL imports](https://nextjs.org/docs/api-reference/next.config.js/url-imports):

```ts
import cors from 'https://cdn.skypack.dev/edge-cors'
```

### Deno

To install it in Deno there are two options, using [deno.land/x/edge_cors](https://deno.land/x/edge_cors):

```ts
import cors from 'https://deno.land/x/edge_cors@VERSION/src/cors.ts'
```

And using [nest.land/package/edge_cors](https://nest.land/package/edge_cors):

```ts
import cors from 'https://x.nest.land/edge_cors@VERSION/src/cors.ts'
```

## How to use

### Basic Usage in Next.js

```ts
import type { NextRequest } from 'next/server'
import cors from 'edge-cors'

export function middleware(req: NextRequest) {
  // `cors` also takes care of handling OPTIONS requests
  return cors(
    req,
    new Response(JSON.stringify({ message: 'Hello World!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}
```

The full example is available in [examples/next](examples/next), and a live demo in [Vercel Examples](https://github.com/vercel/examples/tree/main/edge-functions/cors).

### Basic Usage in Deno

```ts
import { listenAndServe } from 'https://deno.land/std/http/server.ts'
import cors from 'https://deno.land/x/edge_cors/src/cors.ts'

console.log('Listening on http://localhost:8080')

await listenAndServe(':8080', (req) => {
  // `cors` also takes care of handling OPTIONS requests
  return cors(
    req,
    new Response(JSON.stringify({ message: 'Hello World!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  )
})
```

The full example is available in [examples/deno](examples/deno).

The signature of the `cors` function is the following:

```ts
function cors(
  req: Request,
  res: Response,
  options?: CorsOptions | undefined
): Promise<Response>
```

For reference, the types used in the definition are linked below:

- [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request)
- [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)
- [CorsOptions](#cors-options)

### CORS Options

Defined as `CorsOptions` in [src/cors.ts](src/cors.ts), including JSDoc comments with the same docs from below. Defaults to:

```ts
{
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
}
```

#### `origin`

The value to match against the `Access-Control-Allow-Origin`
header in the request. Defaults to `'*'`.

It can be a boolean, string, a regular expression, an array of those, or
a function that returns one of those.

If set to `'*'` all origins will be allowed.

If set to `true` then `Access-Control-Allow-Origin` will
reflect the origin of the request.

If set to `false` then all origins will be denied (`Access-Control-Allow-Origin`
will not be set).

If set to a regular expression then the request origin will be matched
against it.

If set to a function, it will receive the request origin string as the first
parameter and the request as the second parameter. It can return a promise.

#### `methods`

Customizes the `Access-Control-Allow-Methods` header.

It can be a string or an array of strings. Defaults to `'GET,HEAD,PUT,PATCH,POST,DELETE'`.

#### `allowedHeaders`

Configures the `Access-Control-Allow-Headers` header.

It can be a string or an array of strings.
There's no default value (the header is omitted).

#### `exposedHeaders`

Configures the `Access-Control-Expose-Headers` header.

It can be a string or an array of strings.
There's no default value (the header is omitted).

#### `credentials`

Configures the `Access-Control-Allow-Credentials` header.

It can be a boolean. But the header is only set if it is `true`.
There's no default value (the header is omitted).

#### `maxAge`

Configures the `Access-Control-Max-Age` header.

Its value has to be an integer.
There's no default value (the header is omitted).

#### `preflightContinue`

If `true`, `cors` will return the response with updated headers.

If `false`, `cors` will return a new Response object with the status
code set to the value of `optionsSuccessStatus` and a empty body.

Defaults to `false`.

#### `optionsSuccessStatus`

Status code to use for OPTIONS requests when `preflightContinue` is disabled.

Defaults to `204`.

## Contributing

To create a local build of `edge-cors` run the following:

```bash
npm run build

# or

npm run dev
```

To run the tests:

```
npm run test
```

The tests run with [Tape](https://github.com/substack/tape) and Node.js. You can also cd into the examples and follow their readmes to use the local build there.
