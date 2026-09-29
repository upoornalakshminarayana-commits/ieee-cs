// ============================================================
// KHEPRIX 2K26 — Responsive Video & Animation Asset Registry
// Connects separate high-production DESKTOP and MOBILE videos
// ============================================================

// Desktop Video Assets (from "desktop vedios" folder)
import desktopLandingVideo from '../../../../desktop vedios/desktop_landing.mp4'
import desktopStartLoaderVideo from '../../../../desktop vedios/desktop_startloader.mp4'
import desktopStoryVideo from '../../../../desktop vedios/desktop_story.mp4'
import desktopRegistrationVideo from '../../../../desktop vedios/desktop_registration.mp4'

// Mobile Video Assets (from "mobile vedios" folder)
import mobileLandingVideo from '../../../../mobile vedios/mobile_landing.mp4'
import mobileStartLoaderVideo from '../../../../mobile vedios/mobile-start loader.mp4'
import mobileStoryVideo from '../../../../mobile vedios/mobile-story.mp4'
import mobileRegistrationVideo from '../../../../mobile vedios/mobile-registration.mp4'

export const KHEPRIX_VIDEOS = {
  // 1. Initial Mummy Start Loader
  loader: {
    desktop: desktopStartLoaderVideo,
    mobile: mobileStartLoaderVideo,
    urlDesktop: '/videos/desktop/desktop_startloader.mp4',
    urlMobile: '/videos/mobile/mobile-start%20loader.mp4',
    title: 'KHEPRIX 2K26 — Initial Mummy Loader',
  },

  // 2. Landing / Hero Video
  hero: {
    desktop: desktopLandingVideo,
    mobile: mobileLandingVideo,
    urlDesktop: '/videos/desktop/desktop_landing.mp4',
    urlMobile: '/videos/mobile/mobile_landing.mp4',
    fallbackDesktop: '/assets/landing_video.mp4',
    title: 'KHEPRIX 2K26 — Expedition Gateway Hero',
  },

  // 3. Story Map Journey (Spot 1 -> Spot 6)
  story: {
    desktop: desktopStoryVideo,
    mobile: mobileStoryVideo,
    urlDesktop: '/videos/desktop/desktop_story.mp4',
    urlMobile: '/videos/mobile/mobile-story.mp4',
    fallbackDesktop: '/assets/story_map_video.mp4',
    title: 'KHEPRIX 2K26 — Story Map Journey Across Ancient Parchment',
  },

  // 4. Awakened Mummy Guardian / Registration Section Video
  registration: {
    desktop: desktopRegistrationVideo,
    mobile: mobileRegistrationVideo,
    urlDesktop: '/videos/desktop/desktop_registration.mp4',
    urlMobile: '/videos/mobile/mobile-registration.mp4',
    fallbackDesktop: '/assets/mummy_guardian_video.mp4',
    title: 'KHEPRIX 2K26 — The Awakened Mummy Guardian',
  },
} as const
