import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const publicDirectory = resolve(fileURLToPath(new URL('.', import.meta.url)), 'dist')
const port = Number(process.env.PORT || 80)
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${process.env.PORT}`)
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end()
    return
  }

  let pathname
  try {
    pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname)
  } catch {
    response.writeHead(400).end('Bad Request')
    return
  }

  const requestedFile = resolve(publicDirectory, `.${pathname}`)
  if (requestedFile !== publicDirectory && !requestedFile.startsWith(`${publicDirectory}${sep}`)) {
    response.writeHead(403).end('Forbidden')
    return
  }

  let filePath = requestedFile
  try {
    if (!(await stat(filePath)).isFile()) filePath = resolve(publicDirectory, 'index.html')
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') {
      console.error('Unable to access requested file:', error)
      response.writeHead(500).end('Internal Server Error')
      return
    }
    if (pathname.startsWith('/assets/')) {
      response.writeHead(404).end('Not Found')
      return
    }
    filePath = resolve(publicDirectory, 'index.html')
  }

  let fileInfo
  try {
    fileInfo = await stat(filePath)
  } catch (error) {
    console.error('Unable to access static entry point:', error)
    response.writeHead(500).end('Internal Server Error')
    return
  }

  const isAsset = pathname.startsWith('/assets/')
  response.writeHead(200, {
    'Content-Length': fileInfo.size,
    'Content-Type': contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': isAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
  })

  if (request.method === 'HEAD') {
    response.end()
    return
  }

  const stream = createReadStream(filePath)
  stream.on('error', (error) => {
    console.error('Unable to stream static file:', error)
    if (response.headersSent) response.destroy(error)
    else response.writeHead(500).end('Internal Server Error')
  })
  stream.pipe(response)
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Static file server listening on port ${port}`)
})
