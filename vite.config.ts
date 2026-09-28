import { defineConfig, type Plugin } from 'vite'
import path from 'node:path'
import { promises as fs } from 'node:fs'

// In dev, serve the /api functions that Vercel runs in production.
function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/cv-request', async (req, res) => {
        let raw = ''
        for await (const chunk of req) raw += chunk
        const { default: handler } = await server.ssrLoadModule('/api/cv-request.js')
        const shim = Object.assign(res, {
          status(code: number) { res.statusCode = code; return shim },
          json(data: unknown) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)) },
        })
        await handler(Object.assign(req, { body: raw }), shim)
      })
      // the room's ?render=walk posts frames here; they land in the carroto (dock pet) repo
      server.middlewares.use('/__frames', async (req, res) => {
        const q = new URL(req.url ?? '', 'http://x').searchParams
        const name = (q.get('name') ?? 'walk').replace(/[^a-z0-9-]/gi, '')
        const i = Number(q.get('i') ?? 0)
        const dir = path.resolve(__dirname, '../carroto/tools/frames', name)
        // a page reload mid-upload aborts the request; drop that frame instead of crashing the server
        try {
          await fs.mkdir(dir, { recursive: true })
          const chunks: Buffer[] = []
          for await (const c of req) chunks.push(c as Buffer)
          await fs.writeFile(path.join(dir, `${String(i).padStart(4, '0')}.png`), Buffer.concat(chunks))
          res.end('ok')
        } catch {
          res.statusCode = 499
          res.end()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [devApi()],
  server: {
    // Bind IPv4 loopback explicitly. Vite's default listens on ::1 only, and Chrome
    // resolves localhost to 127.0.0.1 first, so the dev server looked dead in the
    // browser while curl (which reaches for IPv6) saw it fine.
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    rollupOptions: {
      // the carrot room is the site; pet.html is the "try him in your browser" popup
      input: { main: 'index.html', pet: 'pet.html' },
      output: {
        // Keep heavy libs in their own chunks so the initial shell stays small.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('three')) return 'three'
        },
      },
    },
  },
})
