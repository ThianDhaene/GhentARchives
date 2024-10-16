import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    // omdat index.html, entry point van de app, nu in 'src' zit
    root: 'src',
    // omdat de root nu in src zit is het pad naar de publicDir nu ../public
    publicDir: '../public',
    envDir: '../',
    
    // voor in geval je de dist niet in de root van je webserver plaatst
    base: './',

    build: {
        outDir: '../dist',
        emptyOutDir: true,
        
        rollupOptions: {
        input: {
            main: resolve(__dirname, 'src/index.html'),
            // zoeken: resolve(__dirname, 'src/zoeken/index.html'),
            // mijnBibliotheek: resolve(__dirname, 'src/mijnBibliotheek/index.html'),
            // login: resolve(__dirname, 'src/login/index.html'),
            // boekPagina: resolve(__dirname, 'src/boekPagina/index.html'),
            // registreer: resolve(__dirname, 'src/registreer/index.html'),
        },
        },
    },
})