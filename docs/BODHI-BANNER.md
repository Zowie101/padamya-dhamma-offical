# Bodhi banner artwork and motion

The index page's opening hero has a decorative Bodhi tree behind the existing text and product photos. It is excluded from the accessibility tree and cannot intercept pointer input.

- The roots/trunk reveal first, followed by a canopy opening. Two clipped/masked views of the same illustration form the visual layers; this is a stylized reveal rather than a botanical growth simulation.
- Falling illustrated heart-shaped leaves begin after the canopy animation finishes.
- Warm fireflies appear only under the existing dark theme and switch automatically with the theme.
- Scroll updates are coalesced into one animation frame and add a small parallax offset and fade. There is no continuous JavaScript render loop.
- IntersectionObserver and document visibility pause CSS animations when the hero is offscreen or the tab is hidden. Event listeners and pending frames are cleaned up on exit; browser back/forward restores remain usable.
- Mobile uses 5 leaves and 7 fireflies, desktop 9 and 13. OS and site reduced-motion settings display a static tree without particles or parallax.
- Native links, image hover interactions, shopping features and the collection carousel remain unchanged.

## Artwork

`assets/images/bodhi-tree-illustration-v1.png` is the original 1536×1024 RGBA generated illustration. It was created with the built-in image-generation tool. `assets/images/bodhi-tree-illustration-v1.webp` preserves transparency and is the production banner asset (about 433 KB versus the 2.77 MB source). Both visual layers reuse this one URL so the browser downloads it once. `bodhi-falling-leaf.svg` is a lightweight decorative leaf for the particles.

Generation prompt:

> Use case: stylized-concept. Asset type: premium illustrated Bodhi tree asset for the banner of Padamya Dhamma, a Myanmar Buddha statue ecommerce website. Create ONE complete, beautiful illustrated sacred Bodhi tree (ဗောဓိညောင်ပင်, Ficus religiosa). The user's reference photos establish a broad leafy crown, a strong branching brown trunk, flared roots, and distinctive heart-shaped green leaves with long pointed drip tips. Their painted reference establishes an illustrated rather than photographic treatment. Draw the tree alone, fully visible, centrally composed with a broad spreading canopy and gently exposed grounded roots, landscape 3:2 composition with a little breathing room around every edge. Style: refined hand-painted botanical editorial illustration, delicate gouache and watercolor textures, graceful natural branching, mature and calm, elegant enough for a minimalist luxury website. Layered muted forest-green, olive and sage foliage, warm umber and soft champagne-gold highlights in the bark, subtle organic leaf detail, dappled natural light. A balanced readable silhouette with a generous crown and visible trunk, no awkward crop. True transparent background, clean alpha edges, no white or colored rectangle, no landscape scenery. Tree and roots only: no Buddha statues, shrine, people, pots, animals, lettering, branding, grid, border or watermark. This is a new illustration informed by the supplied reference descriptions, not a copy of their copyrighted layouts. Deliver one polished high-resolution illustration, not a mockup, collage, or variation sheet.

## Check

Open index in light and dark modes, wait for the reveal, scroll away and back, change the viewport to mobile, then turn on Reduce motion from Accessibility. Verify all links and image hover interactions remain clickable. Automated lifecycle/performance checks run with `node --test tests/bodhi-banner.test.cjs`.
