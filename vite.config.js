import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Time-management/',
  // أعلام الدول تبقى ملفات منفصلة (لا تُدمج داخل ملف الجافاسكربت)
  build: { assetsInlineLimit: (file) => (file.includes('/assets/flags/') ? false : undefined) },
})
