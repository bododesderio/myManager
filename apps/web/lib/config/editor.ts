/**
 * CKEditor 5 configuration.
 *
 * CKEditor 5 (v44+) requires a license key even for open-source use. This app
 * ships with the free open-source key ('GPL'), so the editor works out of the
 * box at no cost — no account, no purchase, no usage limits.
 *
 * ── Adding a paid/commercial key later ─────────────────────────────────────
 * If you buy a CKEditor commercial license (or get a free cloud key from
 * https://portal.ckeditor.com), set it in apps/web/.env.local (and your deploy
 * environment):
 *
 *     NEXT_PUBLIC_CKEDITOR_LICENSE_KEY="your-key-here"
 *
 * then rebuild the web app (`npm run build`). No code change is needed — this
 * value is picked up automatically, overriding the free 'GPL' default.
 *
 * Note: it is a NEXT_PUBLIC_ variable, so it is embedded in the client bundle
 * at BUILD time (CKEditor keys are meant to be public/domain-locked), which is
 * why a rebuild is required after changing it.
 */
export const CKEDITOR_LICENSE_KEY =
  process.env.NEXT_PUBLIC_CKEDITOR_LICENSE_KEY?.trim() || 'GPL';
