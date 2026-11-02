# English and Burmese

Every storefront page includes an **English / မြန်မာ** toggle in the desktop header or inside the hamburger menu on mobile. Appearance settings sit beside it in the mobile menu. The choice is saved in `sacredFormLanguage_v1` and carried between pages. On the first visit, browsers whose language starts with `my` use Burmese; other browsers use English.

Run the existing local HTTP server and open `index.html`. Translation files are loaded from the same site, so use HTTP/HTTPS rather than opening HTML files directly with `file://`.

## Editing copy

`assets/locales/my.json` contains English phrases and their Burmese translations. These are locally authored translations, not live machine translation. Burmese product names are display names; IDs, prices, measurements, product materials used by the comparison algorithm, cart records and form values remain canonical. Ask a native Burmese editor to review brand wording before publication.

`assets/js/language.js` translates static and newly rendered DOM text, accessible labels, placeholders, and titles. Original English is retained for switching back. Add exact phrases to the dictionary when new copy is introduced; variable sentences have explicit patterns in `translate()`. Unknown phrases remain English. Add `data-no-translate` to user-authored output or copy that should stay unchanged. Customer input values are never translated; customer delivery details on the confirmation page are excluded.

`assets/css/language.css` loads the supplied local **A Ka 06** font for display headings and **PT AThwinThit** for emphasized phrases, product titles and editorial accents. PT AThwinThit supplies its own slanted design; CSS does not add synthetic italics. A Ka 06 is optically adjusted to balance the two faces. Body copy and controls retain readable system Myanmar fonts. Burmese line spacing and disabled letter scrambling are preserved. No translation credentials, external font/translation requests or paid dependencies are needed. Product photos and uploaded room photos are not sent anywhere for translation. Device-owned interfaces such as camera permissions and Apple's native AR viewer follow the device/browser language.

## Checks

- Open `tests/language-browser.html` and click **Run checks** for round-trip, dynamic content, canonical values and customer-input checks.
- Test Burmese and English on home, shop, product, wishlist, comparison, cart, checkout, shrine and room studio.
- Search the shop by either English or Burmese product name in Burmese mode. Change a category and the budget range.
- Change language with a product or room placement selected; the selected product must not change.
- Check narrow mobile screens, both themes, and keyboard focus. Check the native AR experience separately on compatible hardware.
