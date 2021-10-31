# CORS Example with Next.js

Below is the code from [pages/\_middleware.ts](pages/_middleware.ts):

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

The original demo is in [Vercel Examples](https://github.com/vercel/examples/tree/main/edge-functions/cors)

## How to use

To run Next.js in development mode:

```bash
npm i
npm run dev
```

Your app should be up and running on http://localhost:3000

To test the local build of `edge-cors` package in the demo, start by building of the package:

```bash
npm run build

# or

npm run watch
```

Then, install it in the example with:

```bash
npm i ../../
```
