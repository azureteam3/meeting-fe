import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // 로컬 개발 시 CORS 없이 백엔드를 호출하고 싶다면 아래 주석을 해제하고
  // .env의 VITE_API_BASE_URL을 '/api', VITE_WS_BASE_URL을 'ws://localhost:5173/ws' 로 바꾸세요.
  // server: {
  //   proxy: {
  //     '/api': { target: 'http://localhost:8000', changeOrigin: true },
  //     '/ws': { target: 'ws://localhost:8000', ws: true },
  //   },
  // },
})
