// ============================================================
// KHEPRIX 2K26 — Responsive Video & Animation Asset Registry
// Connects separate high-production DESKTOP and MOBILE videos
// Served statically from public/videos/ for zero-bundle overhead & Vercel deployment
// ============================================================

export const KHEPRIX_VIDEOS = {
  // 1. Initial Mummy Start Loader
  loader: {
    desktop: '/videos/desktop/desktop_startloader.mp4',
    mobile: '/videos/mobile/mobile-start loader.mp4',
    urlDesktop: '/videos/desktop/desktop_startloader.mp4',
    urlMobile: '/videos/mobile/mobile-start%20loader.mp4',
    title: 'KHEPRIX 2K26 — Initial Mummy Loader',
  },

  // 2. Landing / Hero Video
  hero: {
    desktop: '/videos/desktop/desktop_landing.mp4',
    mobile: '/videos/mobile/mobile_landing.mp4',
    urlDesktop: '/videos/desktop/desktop_landing.mp4',
    urlMobile: '/videos/mobile/mobile_landing.mp4',
    fallbackDesktop: '/assets/landing_video.mp4',
    title: 'KHEPRIX 2K26 — Expedition Gateway Hero',
  },

  // 3. Story Map Journey (Spot 1 -> Spot 6)
  story: {
    desktop: '/videos/desktop/desktop_story.mp4',
    mobile: '/videos/mobile/mobile-story.mp4',
    urlDesktop: '/videos/desktop/desktop_story.mp4',
    urlMobile: '/videos/mobile/mobile-story.mp4',
    fallbackDesktop: '/assets/story_map_video.mp4',
    title: 'KHEPRIX 2K26 — Story Map Journey Across Ancient Parchment',
  },

  // 4. Awakened Mummy Guardian / Registration Section Video
  registration: {
    desktop: '/videos/desktop/desktop_registration.mp4',
    mobile: '/videos/mobile/mobile-registration.mp4',
    urlDesktop: '/videos/desktop/desktop_registration.mp4',
    urlMobile: '/videos/mobile/mobile-registration.mp4',
    fallbackDesktop: '/assets/mummy_guardian_video.mp4',
    title: 'KHEPRIX 2K26 — The Awakened Mummy Guardian',
  },
} as const

