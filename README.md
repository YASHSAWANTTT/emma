# Emma (Zoom translator + practice)

This project is a Zoom-friendly Next.js app: **Translate** text with OpenAI, and **Practice** with short interactive drills (multiple choice, fill-in-the-blank, build-a-sentence) by language and level.

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

## Practice mode (`/practice`)

- Open **Practice** from the top nav or go to `/practice`.
- Pick a **language** (no “auto” — you choose what you’re learning) and a **level**:
  - **Beginner** — roughly A1–A2: short phrases, basic vocabulary.
  - **Intermediate** — roughly B1–B2: everyday topics, richer sentences.
  - **Advanced** — roughly C1-ish: more nuance and longer prompts.
- Each lesson is generated on demand via `POST /api/practice/generate` (OpenAI). Exercises include MCQ, gap fill (`___`), and word-order “build” challenges.

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

- Translate UI: `src/components/TranslatorPanel.tsx` (home `/`).
- Practice UI: `src/components/practice/PracticeSession.tsx` (`/practice`).
- `POST /api/translate` — translation.
- `POST /api/practice/generate` — lesson JSON (exercises array).
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
