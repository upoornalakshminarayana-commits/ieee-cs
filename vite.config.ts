import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

// Middleware to serve desktop & mobile video folders with proper HTTP 206 Range headers
const videoServerPlugin = (): Plugin => ({
  name: 'kheprix-video-server',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url || ''
      let targetPath = ''

      if (url.startsWith('/videos/desktop/')) {
        const rel = decodeURIComponent(url.replace('/videos/desktop/', '').split('?')[0])
        const localPath = path.resolve(__dirname, 'public/videos/desktop', rel)
        targetPath = fs.existsSync(localPath) ? localPath : path.resolve('G:/Mummy/desktop vedios', rel)
      } else if (url.startsWith('/videos/mobile/')) {
        const rel = decodeURIComponent(url.replace('/videos/mobile/', '').split('?')[0])
        const localPath = path.resolve(__dirname, 'public/videos/mobile', rel)
        targetPath = fs.existsSync(localPath) ? localPath : path.resolve('G:/Mummy/mobile vedios', rel)
      }

      if (targetPath && fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
        const stat = fs.statSync(targetPath)
        const range = req.headers.range
        res.setHeader('Content-Type', 'video/mp4')
        res.setHeader('Accept-Ranges', 'bytes')

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-')
          const start = parseInt(parts[0], 10)
          const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
          const chunksize = end - start + 1
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Content-Length': chunksize,
          })
          fs.createReadStream(targetPath, { start, end }).pipe(res)
        } else {
          res.writeHead(200, { 'Content-Length': stat.size })
          fs.createReadStream(targetPath).pipe(res)
        }
        return
      }
      next()
    })
  }
})

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    videoServerPlugin(),
  ],
  server: {
    fs: {
      allow: ['..', '../..', 'g:/Mummy', 'G:/Mummy', 'G:/Mummy/Mummy']
    }
  },
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.mp4'],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('@react-three')) return 'r3f'
          if (id.includes('node_modules/gsap')) return 'gsap'
        }
      }
    }
  }
})
