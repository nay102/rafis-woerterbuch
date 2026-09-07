# Adding Exam Zone materials

The page is at `exam-zone/`. Edit `js/exam-zone-data.js` to manage its catalogue.
The library stays locked until Firebase confirms a verified signed-in account,
and closes immediately on logout. Cached email addresses do not grant access.

## Before uploading private files

GitHub Pages serves repository files publicly. Do **not** commit members-only
PDFs or books to `assets/`, or use public/tokenised download URLs in the catalogue.
Use the existing project's Firebase Storage bucket instead.

1. Enable/configure Firebase Storage for the existing Firebase project.
2. Merge `firebase/exam-zone.storage.rules` into your bucket's deployed rules.
   This is a scoped rules template, **not deployed by this change**. Check that
   no broader rule allows anonymous access to the same paths: matching allow
   rules are additive. Keep unrelated existing rules intact.
3. Configure bucket CORS for `https://nay102.github.io` (and your custom origin
   if used), GET requests, following Firebase's direct-download documentation.
4. Upload PDFs through the Firebase Console under `exam-zone/`. Client uploads
   are deliberately disabled by the template; trusted administrators upload
   through the console. Avoid distributing tokenised/public download links.
5. Verify that anonymous downloads fail and verified signed-in downloads work
   before publishing catalogue entries. Storage/billing/CORS and deployed rules
   have not been configured or verified by this local website change.

The page uses Firebase `getBlob`, so the request is evaluated against Storage
rules. It creates a temporary browser download URL and revokes it on logout.
Downloaded files themselves cannot be recalled from a user's device. Files are
limited to 100 MiB per download. The website service worker does not cache these
cross-origin Storage downloads.

Reference: https://firebase.google.com/docs/storage/web/download-files

## Catalogue entry

Add an object to `EXAM_MATERIALS` for each uploaded material:

```js
{
  id: "goethe-b1-practice-01", // Unique, lowercase letters/numbers/hyphens
  provider: "goethe",        // "goethe" or "telc"
  level: "B1",               // A1, A2, B1, B2 or C1
  category: "exam-papers",
  title: "B1 practice paper 01",
  description: "Reading and writing practice with a separate answer key.",
  edition: "2026",          // Optional edition/variant, e.g. C1 Hochschule
  storagePath: "exam-zone/goethe/B1/practice-01.pdf"
}
```

Available categories: `exam-papers`, `preparation-books`, `reading`, `listening`,
`writing`, `speaking`, `grammar-vocabulary`, `answer-keys`.

Supported file types: PDF, MP3, M4A and WAV. Audio can accompany a listening PDF
as a separate entry. Use simple filenames with letters, numbers, spaces,
hyphens, underscores, parentheses and periods. Keep IDs unique. Clearly name
exam variants (adult/youth, general/professional, C1 Hochschule) in each title
or edition so different formats are not confused.

Publish only materials you are entitled to distribute. No books, exam papers,
invented sample entries or copyrighted content are bundled with this change.
All ten provider/level collections intentionally start empty.

## Files

- `exam-zone/index.html`: shared shell and locked initial state
- `css/exam-zone.css`: scoped responsive design
- `js/exam-zone.js`: real authentication and protected download integration
- `js/exam-zone-library.js`: library UI and session lifecycle
- `js/exam-zone-data.js`: providers, levels, categories and catalogue
