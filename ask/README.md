# Ask MAKE

An additional Question & Form agent experience. The existing landing page and its assets are unchanged.

config.js holds only an approved HTTPS API origin and the email-delivery gate. It contains no secrets. Empty apiBase is an honest draft-only preview: nothing is sent or queued, and email collection is disabled.

When a tested Worker endpoint is connected, this client supports POST /v1/requests, idempotent request IDs and bearer receipt tokens, later GET status/answer checks, and copyable receipt links. Answers use textContent and are never rendered as HTML.

The shared backend contract, private GitHub queue setup, future scheduled task and email prerequisites are in questionandform/questionandform.github.io/backend/README.md. Do not turn on email collection before an approved sender is implemented and tested. No image upload is implemented; SHAPE reserves a clearly labelled future area.
