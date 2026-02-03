import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // 更新があったらすぐに新しいのを読み込む設定
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'], // キャッシュする静的ファイル
      manifest: {
        name: 'My Awesome PWA',
        short_name: 'PWA App',
        description: 'React PWA Template',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icons/icon.png',
            sizes: '700x700',
            type: 'image/png'
          }

        ],
	launch_handler: {
		"client_mode": "auto"
	},
	screenshots: [
		{
			"src": "screenshots/screenshot.jpg",
			"sizes": "1080x760",
			"type": "image/jpeg",
			"form_factor": "wide",
			"label": "Home screen showing main navigation and featured content"
		},
		{
			"src": "screenshots/screenshot.jpg",
			"sizes": "1080x760",
			"type": "image/jpeg",
			"platform": "narrow",
			"label": "Dashboard view displaying key metrics"
		}
	]
      }
    })
  ],
  // ★重要：テンプレートとして使う時、ここはリポジトリ名に合わせて書き換える必要がある場所
  // とりあえず './' にしておくと、サブディレクトリ運用でも動きやすいけど、
  // GitHub Pages推奨は '/リポジトリ名/' なので、使う時に修正必須！
  base: './', 
})
