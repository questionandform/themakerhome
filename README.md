# The Maker Home

The standalone bilingual website for The Maker Home, focused on handmade fluid and textured art.

- `/index.html` is the default Hebrew (RTL) homepage.
- `/en/index.html` is the English (LTR) version.
- `/assets/` contains responsive derivatives of the approved artwork photographs.
- `/css/site.css` contains the shared presentation layer.
- `/js/site.js` contains the single contact configuration point.

## Contact configuration

The contact actions are intentionally hidden until a public business destination is approved. To enable them, set `CONTACT_URL` in `js/site.js` to the approved HTTPS URL. The same destination is applied to both language versions.

## Deployment

The site is published with GitHub Pages from the root of the `main` branch. The custom domain is declared in `CNAME`.
