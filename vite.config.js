import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite puts the stylesheet in <head>, where it stops the browser painting
// anything until it has downloaded, loading screen included. Just above #root
// it only holds back what comes after it, and the app still waits for it.
const stylesheetBelowLoader = {
  name: 'stylesheet-below-loader',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      const link = html.match(/\s*<link rel="stylesheet"[^>]*>/)?.[0]
      if (!link) return html
      return html.replace(link, '').replace('<div id="root">', `${link.trim()}\n    <div id="root">`)
    },
  },
}

export default defineConfig({ plugins: [react(), stylesheetBelowLoader] })
