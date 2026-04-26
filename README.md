# Zoom Marketplace Translator MVP

This project is a Zoom side-panel translation app built with Next.js. Users can type or paste text and translate it into a selected language using OpenAI.

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

- Frontend UI is rendered in `src/components/TranslatorPanel.tsx`.
- Server translation route is `POST /api/translate` in `src/app/api/translate/route.ts`.
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
