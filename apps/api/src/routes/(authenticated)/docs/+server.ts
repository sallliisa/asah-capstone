import { createHash } from 'node:crypto'
import { defineRoute } from '@southneuhof/sprindle'

const start = `
const apiPrefix = location.pathname.startsWith('/api/') ? '/api' : '';
SwaggerUIBundle({
  dom_id: '#api-reference',
  url: apiPrefix + '/openapi.json',
  validatorUrl: null,
  requestInterceptor(request) {
    const url = new URL(request.url, location.origin);
    if (url.origin !== location.origin) throw new Error('Use the current API host.');
    if (apiPrefix && !url.pathname.startsWith('/api/')) url.pathname = apiPrefix + url.pathname;
    request.url = url.href;
    return request;
  }
});
`
const scriptHash = createHash('sha256').update(start).digest('base64')
const csp = `default-src 'none'; script-src 'self' 'sha256-${scriptHash}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'`

export const GET = defineRoute({
  action: ({ c }): Response => {
    c.header('Content-Security-Policy', csp)
    return c.html(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Kos De Mansion API reference</title>
  <link rel="stylesheet" href="./docs/swagger-ui.css">
</head>
<body>
  <main id="api-reference"></main>
  <script src="./docs/swagger-ui-bundle.js"></script>
  <script>${start}</script>
</body>
</html>`)
  },
})
