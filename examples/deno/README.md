# CORS Example with Deno

Below is the code from [main.ts](main.ts):

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

## How to use

First, make sure to have [Deno](https://deno.land/) installed, then you can start the server like so:

```bash
deno run --allow-net main.ts
```

Your server should be up and running on http://localhost:8080

To test the local build of `edge_cors` in the demo, change the import to `cors` in [main.ts](main.ts) to the following:

```ts
import cors from '../../src/cors.ts'
```
