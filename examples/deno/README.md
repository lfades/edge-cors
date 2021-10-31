# CORS Example with Deno

Below is the code from [main.ts](main.ts):

```ts
import { listenAndServe } from 'https://deno.land/std/http/server.ts'
import cors from '../../src/index.ts'

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
