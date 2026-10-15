# Ask MAKE

An additional Question & Form agent experience. The existing landing page and its assets are unchanged.

config.js holds only an approved HTTPS API origin and the email-delivery gate. It contains no secrets. Empty apiBase is an honest draft-only preview: nothing is sent or queued, and email collection is disabled.

When a tested Worker endpoint is connected, this client supports POST /v1/requests, idempotent request IDs and bearer receipt tokens, later GET status/answer checks, and copyable receipt links. Answers use textContent and are never rendered as HTML.

The shared backend contract, private GitHub queue setup, future scheduled task and email prerequisites are in questionandform/questionandform.github.io/backend/README.md. Do not turn on email collection before an approved sender is implemented and tested. No image upload is implemented; SHAPE reserves a clearly labelled future area.


## Community and human-help review

Community sharing and human-help interest are separate, unchecked choices. Conditional help details remain in this tab; contact email and answer email are disabled. No submission, publication, routing, upload, phone/WhatsApp or email collection is active. Contact consent is separate from community consent. The hub backend specification defines private manual review, versioned consent and receipt-authorized withdrawal. THINK additionally requires conservative age/guardian handling and valid HTTPS before activation. Preserve the parent landing page and CNAME. Review branch only; do not merge before screenshot/report approval.
