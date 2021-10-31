// IMPORTANT: Adding imports to relative files can break things, because Deno
// expects a file extension and TS doesn't know how to handle extensions.

export type StaticOrigin =
  | boolean
  | string
  | RegExp
  | (boolean | string | RegExp)[]

export type OriginFn = (
  origin: string | undefined,
  req: Request
) => StaticOrigin | Promise<StaticOrigin>

/**
 * An Object will all possible options that can be passed to `cors`.
 * The default options are:
 *
 * ```ts
 * {
 *  origin: '*',
 *  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
 *  preflightContinue: false,
 *  optionsSuccessStatus: 204,
 * }
 * ```
 *
 * {@link https://github.com/tajpouria/cors#configuration-options}
 */
export interface CorsOptions {
  /**
   * The value to match against the `Access-Control-Allow-Origin`
   * header in the request. Defaults to `'*'`.
   *
   * It can be a boolean, string, a regular expression, an array of those, or
   * a function that returns one of those.
   *
   * If set to `'*'` all origins will be allowed.
   *
   * If set to `true` then `Access-Control-Allow-Origin` will
   * reflect the origin of the request.
   *
   * If set to `false` then all origins will be denied (`Access-Control-Allow-Origin`
   * will not be set).
   *
   * If set to a regular expression then the request origin will be matched
   * against it.
   *
   * If set to a function, it will receive the request origin string as the first
   * parameter and the request as the second parameter. It can return a promise.
   */
  origin?: StaticOrigin | OriginFn
  /**
   * Customizes the `Access-Control-Allow-Methods` header.
   *
   * It can be a string or an array of strings. Defaults to `'GET,HEAD,PUT,PATCH,POST,DELETE'`.
   */
  methods?: string | string[]
  /**
   * Configures the `Access-Control-Allow-Headers` header.
   *
   * It can be a string or an array of strings.
   * There's no default value (the header is omitted).
   */
  allowedHeaders?: string | string[]
  /**
   * Configures the `Access-Control-Expose-Headers` header.
   *
   * It can be a string or an array of strings.
   * There's no default value (the header is omitted).
   */
  exposedHeaders?: string | string[]
  /**
   * Configures the `Access-Control-Allow-Credentials` header.
   *
   * It can be a boolean. But the header is only set if it is `true`.
   * There's no default value (the header is omitted).
   */
  credentials?: boolean
  /**
   * Configures the `Access-Control-Max-Age` header.
   *
   * Its value has to be an integer.
   * There's no default value (the header is omitted).
   */
  maxAge?: number
  /**
   * If `true`, `cors` will return the response with updated headers.
   *
   * If `false`, `cors` will return a new Response object with the status
   * code set to the value of `optionsSuccessStatus` and a empty body.
   *
   * Defaults to `false`.
   */
  preflightContinue?: boolean
  /**
   * Status code to use for OPTIONS requests when `preflightContinue` is disabled.
   *
   * Defaults to `204`.
   */
  optionsSuccessStatus?: number
}

const defaultOptions: CorsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
}

function isOriginAllowed(origin: string, allowed: StaticOrigin): boolean {
  return Array.isArray(allowed)
    ? allowed.some((o) => isOriginAllowed(origin, o))
    : typeof allowed === 'string'
    ? origin === allowed
    : allowed instanceof RegExp
    ? allowed.test(origin)
    : !!allowed
}

function getOriginHeaders(reqOrigin: string | undefined, origin: StaticOrigin) {
  const headers = new Headers()

  if (origin === '*') {
    // Allow any origin
    headers.set('Access-Control-Allow-Origin', '*')
  } else if (typeof origin === 'string') {
    // Fixed origin
    headers.set('Access-Control-Allow-Origin', origin)
    headers.append('Vary', 'Origin')
  } else {
    const allowed = isOriginAllowed(reqOrigin ?? '', origin)

    if (allowed && reqOrigin) {
      headers.set('Access-Control-Allow-Origin', reqOrigin)
    }
    headers.append('Vary', 'Origin')
  }

  return headers
}

async function originHeadersFromReq(
  req: Request,
  origin: StaticOrigin | OriginFn
) {
  const reqOrigin = req.headers.get('Origin') || undefined
  const value =
    typeof origin === 'function' ? await origin(reqOrigin, req) : origin

  if (!value) return
  return getOriginHeaders(reqOrigin, value)
}

function getAllowedHeaders(req: Request, allowed?: string | string[]) {
  const headers = new Headers()

  if (!allowed && typeof allowed !== 'string') {
    allowed = req.headers.get('Access-Control-Request-Headers')!
    headers.append('Vary', 'Access-Control-Request-Headers')
  } else if (Array.isArray(allowed)) {
    // If the allowed headers is an array, turn it into a string
    allowed = allowed.join(',')
  }
  if (allowed) {
    headers.set('Access-Control-Allow-Headers', allowed)
  }

  return headers
}

/**
 * Enables CORS support by changing the headers in the passed `res` and returns a
 * Response object, usually the same `res`.
 */
export default async function cors(
  req: Request,
  res: Response,
  options?: CorsOptions
) {
  const opts = { ...defaultOptions, ...options }
  const { headers } = res
  const originHeaders = await originHeadersFromReq(req, opts.origin ?? false)
  const mergeHeaders = (v: string, k: string) => {
    if (k === 'vary') headers.append(k, v)
    else headers.set(k, v)
  }

  // If there's no origin we won't touch the response
  if (!originHeaders) return res

  originHeaders.forEach(mergeHeaders)

  if (opts.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true')
  }

  const exposed = Array.isArray(opts.exposedHeaders)
    ? opts.exposedHeaders.join(',')
    : opts.exposedHeaders

  if (exposed) {
    headers.set('Access-Control-Expose-Headers', exposed)
  }

  // Handle the preflight request
  if (req.method === 'OPTIONS') {
    if (opts.methods) {
      const methods = Array.isArray(opts.methods)
        ? opts.methods.join(',')
        : opts.methods

      headers.set('Access-Control-Allow-Methods', methods)
    }

    getAllowedHeaders(req, opts.allowedHeaders).forEach(mergeHeaders)

    if (typeof opts.maxAge === 'number') {
      headers.set('Access-Control-Max-Age', String(opts.maxAge))
    }

    if (opts.preflightContinue) return res

    headers.set('Content-Length', '0')
    return new Response(null, { status: opts.optionsSuccessStatus, headers })
  }

  // If we got here, it's a normal request
  return res
}

/**
 * Enables CORS support for given options, and returns a middleware function.
 */
export function initCors(options?: CorsOptions) {
  return (req: Request, res: Response) => cors(req, res, options)
}
