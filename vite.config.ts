import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true
      },
      '/geocoder': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/geocoder/, '')
      }
    }
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'serve-pmtiles',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/data/syria.pmtiles') {
            const filePath = path.resolve('backend/data/syria.pmtiles');
            const stat = fs.statSync(filePath);
            const fileSize = stat.size;
            const range = req.headers.range;

            if (range) {
              const parts = range.replace(/bytes=/, "").split("-");
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
              const chunksize = (end - start) + 1;
              const file = fs.createReadStream(filePath, { start, end });
              res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'application/octet-stream',
                'Access-Control-Allow-Origin': '*'
              });
              file.pipe(res);
            } else {
              res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'application/octet-stream',
                'Access-Control-Allow-Origin': '*'
              });
              fs.createReadStream(filePath).pipe(res);
            }
          } else if (req.url === '/data/syria-style.json') {
            const filePath = path.resolve('backend/data/syria-style.json');
            const stat = fs.statSync(filePath);
            res.writeHead(200, {
              'Content-Length': stat.size,
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            fs.createReadStream(filePath).pipe(res);
          } else {
            next();
          }
        });
      }
    }
  ]
})
