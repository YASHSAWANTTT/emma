# Emma (Zoom translator + practice)

This project is a Zoom-friendly Next.js app: **Translate** text with OpenAI, and **Practice** with a linear lesson path and interactive drills (multiple choice, gap fill with optional word bank, build-a-sentence, and matching pairs).

## Prerequisites

- Node.js 20+
- npm 10+
- A Zoom account with access to Zoom Marketplace
- An OpenAI API key

## Setup

1. Install dependencies:
   - `npm install`
2. Create your env file:
   - `cp .env.example .env.local`
3. Set the required keys in `.env.local`:
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_ZOOM_CLIENT_ID`
   - `ZOOM_CLIENT_ID`
   - `ZOOM_CLIENT_SECRET`
   - `ZOOM_SECRET_TOKEN`
4. Start local dev server:
   - `npm run dev`

The app runs at `http://localhost:3000`.

- **Home** (`/`) — marketing landing with the same animated wave background as the app; optional demo embed via `NEXT_PUBLIC_DEMO_VIDEO_URL` (YouTube, Vimeo, or a direct video URL).
- **Translate** (`/translate`) — OpenAI translation UI.

## Practice mode (`/practice`)

- Open **Practice** from the top nav or go to `/practice`.
- Pick a **language** (no “auto”). You’ll see a **roadmap**: a linear path of lessons (like Duolingo). Finish a lesson to unlock the next. Progress is stored in **`localStorage`** per language (`emma-roadmap-<code>`), with no backend for v1.
- Each node has an implicit **difficulty band** (beginner → intermediate → advanced) that is sent to the generator so prompts stay on-level.
- Lessons are generated on demand via `POST /api/practice/generate` (OpenAI). Exercise types include **MCQ**, **gap** (`___`, optional **word bank**), **build** (word order), and **match** (pair left/right columns). Every item has a short **context** (scenario) and **`listenText`** in the target language.
- **Play** uses normal browser audio: `POST /api/practice/tts` returns synthesized speech (OpenAI), and the client plays it on the **device’s default output** (speakers, headphones, Bluetooth)—the same as any webpage. Audio is **not** injected into Zoom or meeting RTMS. If autoplay is blocked, tap **Play** (user gesture). If TTS fails, the client may fall back to **`speechSynthesis`** where supported.

**Teacher disclaimer:** AI-generated content can be wrong or culturally off. Review material before using it for formal assessment or graded homework.

## Zoom Marketplace Configuration

Create a **Zoom App** in Zoom Marketplace and configure:

- **Development URL**: `http://localhost:3000`
- **Domain allowlist**: include `localhost` (for dev) and your production domain
- **In-meeting side panel**: enable app placement in meetings
- **Scopes**: include the minimum scopes needed for your app installation flow (for this MVP, only side-panel rendering is required)

Install the app to your Zoom test account, then open a meeting and launch the app from Zoom Apps.

### Map Marketplace values to `.env.local`

- **Client ID** in Zoom Marketplace:
  - `NEXT_PUBLIC_ZOOM_CLIENT_ID`
  - `ZOOM_CLIENT_ID`
- **Client Secret** in Zoom Marketplace:
  - `ZOOM_CLIENT_SECRET`
- **Secret Token** in Zoom Marketplace:
  - `ZOOM_SECRET_TOKEN`

## How It Works

- Landing: `src/components/landing/LandingPage.tsx` (`/`).
- Translate UI: `src/components/TranslatorPanel.tsx` (`/translate`).
- Practice UI: `src/components/practice/PracticeSession.tsx` (`/practice`).
- `POST /api/translate` — translation.
- `POST /api/practice/generate` — lesson JSON (exercises array); optional `lessonKey` / `nodeIndex` tailor the prompt per roadmap step.
- `POST /api/practice/tts` — speech audio (`audio/mpeg`) for `listenText` playback (uses OpenAI quota).
- OpenAI key is only used server-side.

## Test Plan

1. Launch app locally with `npm run dev`.
2. Open app in browser and validate:
   - text input updates correctly
   - source/target language selectors work
   - translation response appears
   - copy button copies translated text
3. In Zoom meeting:
   - open Zoom App side panel
   - verify panel loads in-meeting
   - run manual translation flow end-to-end

## Notes

- Current MVP supports manual lookups only (no automatic live caption streaming).
- Basic in-memory rate limiting is included in the API route.
