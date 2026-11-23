# Setup

1. Install packages: `npm install`
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `PORT`.
3. Start the server: `npm run server`
4. In another terminal start the client: `npm start -- --server http://localhost:3000`
5. Open a second terminal and run the client again to chat with yourself.

Tests: `npm test` (needs a working database and the server dependencies).
