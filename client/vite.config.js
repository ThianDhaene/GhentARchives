import { defineConfig } from 'vite'
import { resolve } from 'path'
import basicSsl from '@vitejs/plugin-basic-ssl'


export default defineConfig({
    // omdat index.html, entry point van de app, nu in 'src' zit
    root: 'src',
    // omdat de root nu in src zit is het pad naar de publicDir nu ../public
    publicDir: '../public',
    envDir: '../',
    
    // voor in geval je de dist niet in de root van je webserver plaatst
    base: './',

    plugins: [
        basicSsl()
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