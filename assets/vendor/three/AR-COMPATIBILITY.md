# Sacred Form AR compatibility patch

Pinned upstream: Three.js r180 (0.180.0), MIT license in LICENSE.

The only source change in three.module.js is WebXRManager.setSession's supportsLayers condition. An opt-in property, renderer.xr.preferWebGLLayer = true, selects XRWebGLLayer even when XRWebGLBinding advertises createProjectionLayer. Other users of the vendor module retain the original selection behavior.

Room Studio sets this flag before setSession. This avoids the newer projection-layer submission path for mobile AR compatibility. Tracking, hit testing, DOM overlays and all actual GLB rendering remain enabled. No browser flags, certificate bypasses or global API replacements are used in production.

Related upstream report: https://github.com/mrdoob/three.js/issues/33404

When upgrading Three.js, reassess this compatibility hook and retest physical Android devices. tests/room-xr-native-browser.html exercises the real Three.js WebXRManager with a simulated XRWebGLLayer framebuffer, rather than bypassing the manager with an ordinary renderer.
