import type { NextRequest } from 'next/server'
import cors from 'edge-cors'
// The following URL can be used to import the module too
// import cors from 'https://cdn.skypack.dev/edge-cors'

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
