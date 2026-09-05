# Learning improvements

## Daily practice

Open **A1 → Start today's 10-minute practice**, or `progress/?level=A1#daily`.
The plan offers five flashcards, five grammar questions (or a vocabulary focus review), and an unfinished library topic. The time is an estimate, not a countdown. Steps complete from saved activity evidence; opening a link alone does not complete one. The checklist resumes for the local calendar day. A new day's plan uses the latest available progress.

The checklist is persistent; an unfinished exercise round itself still starts a fresh round when its page is reopened. Library lessons retain their existing resume behavior.

## Account progress

All eight A1 activities, Mixed Mastery, the daily checklist and library progress now use `learning-storage.js`. Legacy browser progress remains in the guest scope. Signing in switches to an isolated account scope and reloads the page so existing exercise closures cannot write into another account.

Account progress uploads automatically when cloud sync is enabled. **My A1 Progress → Sync now** also restores remote progress. Open that dashboard on a second device before starting practice there. Active exercise pages do not replace their in-memory state with a remote snapshot.

The dashboard offers JSON backup export and an explicit action to copy guest data into empty account activities. Copying guest data preserves existing account records, including resets. The exported JSON is an archival backup; a restore-file UI is not included.

Firestore transactions merge records under `users/{uid}.learningProgressV2`, preserving unrelated profile fields. Conflict resolution uses the latest device timestamp per activity; simultaneous changes to the same activity are not added together. The library is one activity record. Device clocks should agree. Reset tombstones prevent older device data from undoing a reset. A1 reset preserves other library levels. Offline failures keep local work and show a retry message.

The implementation uses the existing account document permissions. No Firebase rules or live account records were changed during development. See [Firebase transactions](https://firebase.google.com/docs/firestore/manage-data/transactions) and [transaction merge options](https://firebase.google.com/docs/reference/js/firestore.transaction).

## Content audit

Run `node scripts/audit-learning-content.mjs`.

The expanded audit checks required fields, IDs, examples, generated conjugations, noun articles, plural information, Bengali script, Unicode replacement characters, seven A1 bank validators and bilingual flashcard coverage.

After corrections: **1,653 dictionary entries, 361 flashcards, seven bank validators; zero reported errors or warnings.** This is structural coverage plus a targeted editorial review, not a certification of every translation, synonym, sentence or CEFR level.

Corrections include:

- Bengali health translations in `noun166`, replacing Hindi, and a natural English translation of the sneezing example.
- Missing plurals for Regisseur, Studiengebühr and Umfrage.
- More precise English equivalents and synonyms for Umfrage.
- Bengali cousin and family descriptions, an ordering question and seven tens vocabulary entries, correcting 12 flashcards at their library sources.

German reference checks: [Regisseur](https://www.duden.de/rechtschreibung/Regisseur), [Studiengebühr](https://www.duden.de/rechtschreibung/Studiengebuehr), [Umfrage](https://www.duden.de/rechtschreibung/Umfrage), [Gesundheit](https://www.duden.de/rechtschreibung/Gesundheit). Bengali corrections were editorial translations.

## Accessibility and maintainability

Shared keyboard support adds a skip link, keyboard home navigation, login field labels, dialog focus containment and restoration, and keyboard access to legacy close controls. Mobile dialog sizing, visible focus outlines and larger daily-practice controls were added. Flashcards restore focus as cards change, cancel obsolete audio and report unavailable German speech.

`ui.js` was reduced from about 5,681 to 4,727 lines. Extracted modules contain dictionary formatting, route helpers, account settings and static page content. The service worker precaches all new runtime modules and has an updated cache version; dictionary data also has a new version.

## Verification

```
node --test --experimental-vm-modules tests/learning.test.mjs tests/learning-sync.test.mjs
node --experimental-vm-modules scripts/check-module-graph.mjs
node scripts/audit-learning-content.mjs
git diff --check
```

The tests exercise account isolation, offline authentication, cloud opt-out, failure recovery, two-device record merging, reset preservation, daily rollover, cloud-safe checklist previews and extracted formatting. Firebase calls are mocked. Module linking checks local imports and exports without executing the browser application.

The session had no available browser connection. These checks remain to be performed in a real browser:

1. At 360px and 390px widths, open A1, progress, a flashcard session, a lesson and login/profile dialogs. Check overflow, controls, dark mode and text enlargement.
2. Using only the keyboard, use the skip link, home control, dialog open/close, Tab/Shift+Tab, flashcard flip/rating and daily return links. Verify focus restoration.
3. Complete a daily plan, refresh, return from an activity and verify its saved checklist.
4. With the same test account on two devices, sync the dashboard, practise on the first device, then sync the second. Verify progress and resets propagate. Also check cloud sync off and offline retry.
5. Switch between guest and two test accounts; verify each account's progress remains separate and explicit guest import preserves existing account activities.
6. Verify updated service-worker installation and offline reopening of the dashboard and practice pages.
