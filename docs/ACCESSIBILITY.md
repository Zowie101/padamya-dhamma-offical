# Accessibility

Open **Accessibility** in the account/mobile menu's Preferences section. Room Studio has the same entry beneath its controls. No extra floating bubble is added.

- Text: a live slider from 100% to 130% in 1% increments. Previous saved 115%/130% presets remain compatible. Text enlarges independently of product photos and placement coordinates. Larger text may require more scrolling.
- Higher contrast supports both light and dark themes without applying filters to product photography.
- Underlined links provide an additional visual cue.
- Reduced motion disables decorative CSS motion, page fade delays, CTA scrambling, progressive Sage replies, and automatic product rotation. Device reduced-motion preferences always take precedence; manually requesting model rotation is still possible.
- Preferences stay locally in `sacredFormAccessibility_v1`; reset affects only accessibility settings. Blocked or corrupted storage falls back safely.

The panel slides in from the right and uses a native modal dialog with a label, keyboard focus containment, Escape dismissal and focus restoration. Every page has a keyboard-visible skip link and stronger focus outlines; main navigation identifies the current page, and bag notifications use a status region. Room Studio retains arrow-key placement, Shift+arrow larger movements, Delete and Ctrl/Cmd+Z, plus labelled size and rotation controls.

English and Burmese panel copy is built in. Browser zoom and assistive technologies remain available; this panel does not replace them. This is an accessibility improvement, not a WCAG compliance certification.

## Verification

1. Tab from the page start and activate **Skip to main content**.
2. Open Preferences → Accessibility using the keyboard; test Tab/Shift+Tab, Escape and focus restoration.
3. Set every preference; navigate/reload and confirm it persists. Reset and verify other preferences, cart and account remain intact.
4. At mobile widths, try 130% text and both languages; use normal page/panel scrolling.
5. Enable Reduce motion, then open a product model or send Sage a message; initial rotation is stopped and replies appear immediately.
6. Test with system reduced motion, native browser zoom and an actual screen reader before claiming conformance.

Automated regression tests: `node --run test`. Storage validation tests are in `tests/accessibility.test.cjs`.

Reference guidance: [W3C focus visibility](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), [modal dialog keyboard pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), and [target sizing](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
