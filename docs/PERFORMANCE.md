# 3D preview performance

Product detail, shrine preview, WebXR and iPhone AR now use the same optimized GLB for each statue (`assets/models/optimized/`). The full-size original models remain in the six Buddha folders. No runtime compression decoder or external model-viewer CDN is required; product and shrine pages use the existing local model-viewer 4.1.0 bundle.

The optimized models are 4.0–4.9 MB (decimal), compared with roughly 37–45 MB for the original product models. Embedded textures are at most 1024 px; meshes contain roughly 102,000–108,000 triangles. Scene transforms and bounds are preserved for shrine grounding, real-world scaling and AR conversion. Base colour and material textures use high-quality JPEG; normal maps retain PNG. These are preview assets; originals are retained for future higher-resolution use.

Lightweight transparent WebP posters are approximately 80–124 KB. Gallery thumbnails have separate small files, and full-size front/side/back images load when selected. Catalogue cards and the shrine carousel also use the lightweight front images.

## Rebuild

Run from the website directory with Node.js and Sharp available:

```sh
node tools/build-optimized-models.mjs
node tools/build-preview-images.mjs
```

The model script reads the previous mobile assets in `assets/models/ar/` and uses the existing local meshoptimizer simplifier. The `originalBytes` fields in its report refer to those mobile inputs, not the larger original product files. The image script reads the original transparent PNGs. Both scripts preserve their sources. Generated files are committed with the website; visitors do not run these tools.

## Verify

```sh
node --test tests/room-assets.test.mjs tests/room-model.test.mjs tests/room-ios.test.mjs tests/room-state.test.mjs
```

Asset checks enforce the download budget, standard texture formats, retained scene transforms and near-identical bounds. In the browser, check all six product models, gallery image selection, shrine carousel, shrine styles and size changes. Test actual AR on compatible phones over HTTPS; desktop checks cannot validate hardware tracking or native Quick Look.

Download reduction does not imply an identical percentage reduction in total load time: connection speed, browser caching, GPU capability and model processing also matter. To compare loading, disable the browser cache, use the same network throttle and product, and inspect the GLB request and time until the model renders. Ordinary browser caching can reuse the identical model URL between product, shrine and room views when the host permits it.
