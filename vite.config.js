import { defineConfig } from 'vite'
import restart from 'vite-plugin-restart'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
    // Remove root: 'src/' to avoid 404s
    // publicDir: '/src/',
    root: 'src/',
    publicDir: '../static/',
    server: {
        host: true,
        open: true,
        https: true,
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true
    },
    plugins: [
        restart({
            restart: [
                'src/**', // Watches all files in src for a restart
                'static/**',
            ]
        }),
        basicSsl()
    ],
})
