import { defineConfig } from 'vite'
import { resolve } from 'path'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa';


export default defineConfig({
    // omdat index.html, entry point van de app, nu in 'src' zit
    root: 'src',
    // omdat de root nu in src zit is het pad naar de publicDir nu ../public
    publicDir: '../public',
    envDir: '../',
    
    // voor in geval je de dist niet in de root van je webserver plaatst
    base: './',

    plugins: [
        // basicSsl(),
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
                    urlPattern: /^https:\/\/.*\.(?:js|css|html)$/, // Cache voor JavaScript, CSS en HTML bestanden
                    handler: 'CacheFirst', // CacheFirst om offline toegankelijk te maken
                    options: {
                      cacheName: 'static-resources',
                      expiration: {
                        maxEntries: 50, // Aantal bestanden om op te slaan
                        maxAgeSeconds: 30 * 24 * 60 * 60, // Bewaarduur: 30 dagen
                      },
                    },
                  },
                  {
                    urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif)$/, // Cache voor afbeeldingen
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
                    urlPattern: /.*/, // Cache alle andere routes
                    handler: 'NetworkFirst', // NetworkFirst voor dynamische content
                    options: {
                      cacheName: 'pages-cache',
                      expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 7 * 24 * 60 * 60, // Bewaarduur: 7 dagen
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