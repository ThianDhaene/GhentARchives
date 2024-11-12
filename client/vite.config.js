import { defineConfig } from 'vite'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    root: 'src',
    publicDir: '../public',
    envDir: '../',
    base: './',

    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: {
              enabled: true
            },
            manifest: {
              name: 'GhentARchives',
              short_name: 'GhentARchives',
              description: 'App voor het ontdekken van historische gebouwen in Gent',
              theme_color: '#ffffff', 
              background_color: '#ffffff', 
              display: 'standalone',
              start_url: '/', 
              icons: [
                {
                  src: '/icon_192.png',
                  sizes: '192x192',
                  type: 'image/png'
                },
                {
                  src: '/icon_512.png',
                  sizes: '512x512',
                  type: 'image/png'
                }
              ]
            },
            workbox: {
                runtimeCaching: [
                  {
                    urlPattern: /^https:\/\/.*\.(?:js|css|html)$/, 
                    handler: 'CacheFirst', 
                    options: {
                      cacheName: 'static-resources',
                      expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 30 * 24 * 60 * 60,
                      },
                    },
                  },
                  {
                    urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif)$/,
                    handler: 'CacheFirst',
                    options: {
                      cacheName: 'image-cache',
                      expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 30 * 24 * 60 * 60,
                      },
                    },
                  },
                  {
                    urlPattern: /.*/,
                    handler: 'NetworkFirst',
                    options: {
                      cacheName: 'pages-cache',
                      expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 7 * 24 * 60 * 60,
                      },
                    },
                  }
                ]
              }
          })
      ],
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        
        rollupOptions: {
        input: {
            main: resolve(__dirname, 'src/index.html'),
            about: resolve(__dirname, 'src/about/index.html'),
            contact: resolve(__dirname, 'src/contact/index.html'),
            arpage: resolve(__dirname, 'src/arpage/index.html'),
            // boekPagina: resolve(__dirname, 'src/boekPagina/index.html'),
            // registreer: resolve(__dirname, 'src/registreer/index.html'),
        },
        },
    },
})