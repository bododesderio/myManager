# Changelog

## [Unreleased] - 2026-03-24

### Added
- Public platforms API endpoint (`GET /api/v1/platforms`) for dynamic platform data
- `usePlatforms` React Query hook for frontend platform data fetching
- OAuth callback page (`/connect/oauth`) for social account connection flow
- WhatsApp Business, Webhooks, Services, and Branding credential sections in admin
- RichTextEditor integration for bio descriptions, workspace/project descriptions, and lead notes

### Changed
- ComposeContent now fetches platform character limits dynamically from database instead of hardcoded values
- BlogEditorContent categories fetched from API with fallback to defaults
- SeoContent OG Image field now uses FileUpload component instead of URL text input
- FAQ new item form upgraded from plain textarea to RichTextEditor
- Theme settings error handling now shows toast notifications instead of silent failures
- .gitignore expanded with `.env.production`, `.env.staging`, `*.pem`, `*.cert`, `*.crt`, `.npmrc` patterns
- Admin credentials page expanded with WhatsApp, Webhooks, Services, and Branding sections

### Fixed
- Three TODO comments in theme settings replaced with actual toast error notifications

### Docker & Infrastructure
- Enabled Next.js standalone output for Docker production builds
- Fixed Web Dockerfile double pnpm install
- Added NEXT_PUBLIC_API_URL to Docker Compose web service
- Updated .dockerignore with comprehensive exclusions
- Updated .gitignore to cover log files and uploads directory
- Removed build.log from git tracking

### File Upload System
- Implemented real file upload in `/api/upload` route with local storage and Cloudflare R2 support
- Created reusable `FileUpload` component with drag-and-drop, preview, and progress indicator
- Replaced all URL text inputs with file upload pickers:
  - Admin brand: logo, favicon
  - Blog editor: cover image, OG image
  - CMS page editor: IMAGE_URL field type
  - Workspace brand settings: logo
  - User profile: avatar
  - Bio page: avatar

### Rich Text Editor (CKEditor 5)
- Installed CKEditor 5 with React integration
- Created `RichTextEditor` wrapper with visual/source toggle
- Replaced plain textareas with rich text editors:
  - Blog post body and excerpt
  - FAQ answers
  - CMS page RICHTEXT fields
  - Testimonial quotes

### Placeholder & Mock Data Removal
- Fixed hardcoded UGX conversion rate — now fetched dynamically from exchange rates API
- Fixed placeholder CDN URL in upload route — now uses real storage
- Replaced hardcoded brand config CDN URLs with empty defaults (real values from DB)
- **Mobile app** — Wired all 15+ screens to real API endpoints:
  - Auth hooks (login, signup, logout, forgot password) now call real API
  - Plan hook fetches user subscription instead of hardcoding 'free'
  - Brand hook loads from API with MMKV caching
  - Locale hook persists to MMKV storage
  - All screen data (home, compose, settings, team, approvals, conversations, campaigns, media, projects) fetched from API
  - Media components (camera, gallery, editor) implemented with Expo modules

### New Admin Pages
- **Audit Log Viewer** (`/admin/audit`) — Filter, paginate, and export audit trail
- **System Settings** (`/admin/settings`) — Toggle maintenance mode, registration, blog, affiliate features
- **Credentials Manager** (`/admin/settings/credentials`) — Manage all production OAuth, payment, email, storage, AI, and analytics credentials from the admin UI with AES-256 encryption

### Admin UI Improvements
- Added full admin sidebar navigation with categorized menu (Overview, Users, Billing, Content, Infrastructure, Settings)
- Wired Email Templates page to real API with RichTextEditor
- Wired Translations page to real API with per-language editing
- Wired Legal Pages to CMS API with RichTextEditor and publish/draft toggle
- Verified Newsletter subscribers page is fully functional

### API Changes
- Added `SystemConfig` Prisma model for encrypted key-value configuration storage
- Created `system-config` NestJS module with encrypted CRUD operations
- `getConfigValue()` method checks DB first, falls back to environment variables

### Documentation
- Updated SETUP.md with Docker quick start instructions
- Fixed API port references (3001, not 4000)
- Added seed command documentation for full database seeding
- Created CHANGELOG.md
