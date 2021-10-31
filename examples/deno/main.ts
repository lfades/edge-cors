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
