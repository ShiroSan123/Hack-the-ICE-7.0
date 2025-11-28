import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import legacy from "@vitejs/plugin-legacy";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
	server: {
		host: "::",
		port: 8080,
	},
	plugins: [
		react(),
		legacy({
			targets: ['defaults', 'chrome >=61', 'android >=5', 'safari >=11'],
			modernPolyfills: true,
		}),
		mode === "development" && componentTagger(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: [
				'favicon.ico',
				'robots.txt',
				'icons/apple-touch-icon.png'
			],
			devOptions: {
				enabled: true,
				type: 'module'
			},
			manifest: {
				name: 'Рука помощи | Социальный Навигатор',
				short_name: 'Рука помощи',
				description: 'Социальный навигатор для льготных категорий граждан',
				lang: 'ru',
				dir: 'ltr',
				id: '/',
				scope: '/',
				start_url: '/',
				display: 'standalone',
				display_override: ['window-controls-overlay', 'standalone'],
				orientation: 'portrait',
				background_color: '#fafafa',
				theme_color: '#3eaa7d',
				categories: ['social', 'productivity', 'health'],
				shortcuts: [
					{
						name: 'Мои льготы',
						short_name: 'Льготы',
						description: 'Перейти к персональным льготам',
						url: '/benefits'
					},
					{
						name: 'Аптечка',
						short_name: 'Аптечка',
						description: 'Список лекарств и скидок',
						url: '/apteka'
					},
					{
						name: 'Ассистент',
						short_name: 'Ассистент',
						description: 'Чат-бот Рука помощи',
						url: '/assistant'
					}
				],
				icons: [
					{
						src: 'icons/pwa-icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: 'icons/pwa-icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: 'icons/maskable-icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				cleanupOutdatedCaches: true,
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/.*\.json$/,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'api-cache',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24 // 24 hours
							}
						}
					},
					{
						urlPattern: /^https:\/\/[^/]+\.supabase\.co\/rest\/v1\/.*$/i,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'supabase-rest',
							networkTimeoutSeconds: 5,
							expiration: {
								maxEntries: 60,
								maxAgeSeconds: 60 * 5
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					{
						urlPattern: /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/.*$/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'supabase-storage',
							expiration: {
								maxEntries: 40,
								maxAgeSeconds: 60 * 60 * 24 * 7
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					}
				]
			}
		})
	].filter(Boolean),
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
}));
