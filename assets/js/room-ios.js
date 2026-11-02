// Apple's native AR viewer uses USDZ rather than an immersive WebXR session.
export function isAppleMobile(nav = navigator) {
  return (
    /iPhone|iPad|iPod/.test(nav.userAgent) ||
    (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)
  )
}
export function supportsQuickLook() {
  try {
    return document.createElement('a').relList.supports('ar')
  } catch {
    return false
  }
}

export async function prepareQuickLook({ product, mount, signal, onStatus }) {
  let viewer, url
  const check = () => {
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
  }
  const dispose = () => {
    if (url) {
      URL.revokeObjectURL(url)
      url = null
    }
    if (viewer) {
      viewer.removeAttribute('src')
      viewer.remove()
    }
  }
  signal.addEventListener('abort', dispose, { once: true })
  try {
    onStatus('Preparing your statue for iPhone AR…')
    if (!customElements.get('model-viewer'))
      await import('../vendor/model-viewer/model-viewer.min.js?v=4.1.0')
    check()
    viewer = document.createElement('model-viewer')
    viewer.setAttribute('loading', 'eager')
    viewer.setAttribute('ar-usdz-max-texture-size', '1024')
    viewer.setAttribute('aria-hidden', 'true')
    viewer.setAttribute('scale', '1 1 1')
    const loaded = new Promise((resolve, reject) => {
      const cleanup = () => {
        viewer.removeEventListener('load', ready)
        viewer.removeEventListener('error', fail)
        signal.removeEventListener('abort', abort)
      }
      const ready = () => {
        cleanup()
        resolve()
      }
      const fail = () => {
        cleanup()
        reject(
          Error(
            'The iPhone model could not load. Try another statue or camera overlay.'
          )
        )
      }
      const abort = () => {
        cleanup()
        reject(new DOMException('Cancelled', 'AbortError'))
      }
      viewer.addEventListener('load', ready, { once: true })
      viewer.addEventListener('error', fail, { once: true })
      signal.addEventListener('abort', abort, { once: true })
    })
    viewer.src = product.arModel || product.model
    mount.append(viewer)
    await loaded
    check()
    const height = viewer.getDimensions().y
    if (!Number.isFinite(height) || height <= 0)
      throw Error('The model dimensions could not be read.')
    const scale = parseFloat(product.height) / 100 / height
    viewer.scale = `${scale} ${scale} ${scale}`
    await viewer.updateComplete
    viewer.updateFraming()
    await viewer.updateComplete
    check()
    onStatus('Creating the Apple AR file on this device…')
    // Conversion finishes before showing the native link, preserving Safari's
    // requirement that launching Quick Look comes directly from a user tap.
    url = await viewer.prepareUSDZ()
    check()
    if (!url) throw Error('The Apple AR file could not be created.')
    onStatus(
      `${product.name} · ${product.height}. Open AR, then move your phone slowly to find a surface.`
    )
    return { url, dispose, viewer }
  } catch (error) {
    dispose()
    throw error
  }
}
