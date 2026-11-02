/* Real WebXR hit testing. Loaded only when the user chooses surface AR. */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { bindStatueGestures, wrapDegrees, dampAngle } from './room-gestures.mjs?v=20261101-3'
import { isHorizontal, clamp } from './room-state.mjs?v=20261031-6'
import {
  prepareRoomModel,
  previewFromViewer
} from './room-model.mjs?v=20261031-6'

export function disposeModel(root) {
  const disposed = new Set()
  root?.traverse(object => {
    if (object.geometry && !disposed.has(object.geometry)) {
      disposed.add(object.geometry)
      object.geometry.dispose()
    }
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if (!material || disposed.has(material)) continue
      disposed.add(material)
      for (const texture of Object.values(material)) {
        if (!texture?.isTexture || disposed.has(texture)) continue
        disposed.add(texture)
        texture.dispose()
        texture.image?.close?.()
      }
      material.dispose()
    }
  })
}

export async function startSurfaceAR(
  { overlay, product, signal, onStatus, onState, onEnd, onError },
  runtime = {}
) {
  // Must be the first asynchronous call inside the user's Start AR click.
  const requestSession =
    runtime.requestSession ||
    ((...args) => navigator.xr.requestSession(...args))
  const session = await requestSession('immersive-ar', {
    requiredFeatures: ['dom-overlay'],
    optionalFeatures: ['hit-test', 'local-floor'],
    domOverlay: { root: overlay }
  })
  if (signal.aborted) {
    await session.end()
    throw new DOMException('Cancelled', 'AbortError')
  }
  let renderer,
    scene,
    camera,
    hitSource,
    referenceSpace,
    reticle,
    anchor,
    yawGroup,
    sizeGroup,
    model,
    environment
  let closed = false,
    loading = false,
    placing = true,
    placed = false,
    hasSurface = false,
    tracking = false,
    manuallyPlaced = false,
    graphicsLost = false,
    previewEnabled = true
  let scale = 1,
    rotation = 0,
    distance = 0.65,
    loadVersion = 0,
    fetchController,
    statusKey = '',
    currentProduct = product
  let frameCount = 0,
    renderDetails = {},
    shaderError = null,
    modelCentre = null,
    endRequest = null
  const loader = new GLTFLoader()
  let gestures
  let previousFrameTime = null, gestureDirty = false, lastGestureEmit = 0
  function setScale(value) {
    scale = clamp(value, 0.5, 2)
    sizeGroup.scale.setScalar(scale)
    emit()
  }
  function setRotation(value) {
    rotation = clamp(value, -180, 180)
    emit()
  }
  const emit = () =>
    onState({
      ready: !loading && Boolean(model) && !graphicsLost,
      placed,
      placing,
      hasSurface,
      tracking,
      manuallyPlaced,
      surfaceDetection: Boolean(hitSource),
      removed: !previewEnabled,
      scale,
      rotation,
      distance
    })
  function trackingStatus() {
    const key = [
      loading,
      Boolean(model),
      tracking,
      hasSurface,
      placed,
      placing,
      manuallyPlaced,
      Boolean(hitSource),
      graphicsLost,
      previewEnabled
    ].join(':')
    if (key === statusKey) return
    statusKey = key
    emit()
    if (loading || !model || graphicsLost) return
    onStatus(
      !previewEnabled
        ? 'Tap Move to preview again.'
        : !tracking
          ? 'Tracking paused. Move your phone slowly.'
          : !placing
            ? manuallyPlaced
              ? 'Placed manually · swipe to rotate, pinch to resize.'
              : 'Placed · swipe to rotate, pinch to resize.'
            : hasSurface
              ? 'Ready to place.'
              : 'Find a surface, or place manually.'
    )
  }
  function cleanup() {
    if (closed) return
    closed = true
    loadVersion++
    fetchController?.abort()
    gestures?.dispose()
    hitSource?.cancel()
    renderer?.setAnimationLoop(null)
    renderer?.domElement.removeEventListener(
      'webglcontextlost',
      graphicsFailure
    )
    session.removeEventListener('select', place)
    signal.removeEventListener('abort', end)
    disposeModel(model)
    disposeModel(reticle)
    if (scene) scene.environment = null
    environment?.dispose()
    scene?.clear()
    renderer?.dispose()
    renderer?.forceContextLoss()
    renderer?.domElement.remove()
    onEnd()
  }
  function end() {
    if (closed) return Promise.resolve()
    endRequest ||= session.end().catch(cleanup)
    return endRequest
  }
  function graphicsFailure(event) {
    event?.preventDefault()
    graphicsLost = true
    emit()
    onError(
      '3D graphics stopped on this device. Close AR and try again, or use the camera overlay.'
    )
  }
  function place() {
    if (
      closed ||
      gestures?.blocksPlacement ||
      !previewEnabled ||
      !placing ||
      !hasSurface ||
      loading ||
      !model
    )
      return
    anchor.position.setFromMatrixPosition(reticle.matrix)
    anchor.visible = true
    placed = true
    placing = false
    reticle.visible = false
    manuallyPlaced = false
    trackingStatus()
  }
  function placeManual() {
    if (
      closed ||
      !previewEnabled ||
      !placing ||
      !tracking ||
      hasSurface ||
      loading ||
      !model ||
      !anchor.visible ||
      graphicsLost
    )
      return
    placed = true
    placing = false
    manuallyPlaced = true
    reticle.visible = false
    trackingStatus()
  }
  async function setProduct(next) {
    currentProduct = next
    previewEnabled = true
    const version = ++loadVersion
    fetchController?.abort()
    fetchController = new AbortController()
    disposeModel(model)
    sizeGroup.clear()
    model = null
    modelCentre = null
    anchor.visible = false
    loading = true
    onStatus(`Loading ${next.name} in 3D…`)
    emit()
    try {
      const modelUrl = next.arModel || next.model
      const response = await fetch(modelUrl, { signal: fetchController.signal })
      if (!response.ok) throw Error('The 3D file could not be loaded')
      const bytes = await response.arrayBuffer()
      if (closed || version !== loadVersion) return
      const gltf = await loader.parseAsync(
        bytes,
        new URL('.', new URL(modelUrl, location.href)).href
      )
      if (closed || version !== loadVersion) {
        disposeModel(gltf.scene)
        return
      }
      let normalized
      try {
        normalized = prepareRoomModel(gltf.scene, next.height)
      } catch (error) {
        disposeModel(gltf.scene)
        throw error
      }
      modelCentre = new THREE.Box3()
        .setFromObject(normalized, true)
        .getCenter(new THREE.Vector3())
      disposeModel(model)
      sizeGroup.clear()
      model = normalized
      sizeGroup.add(model)
      anchor.visible = placed && tracking
      loading = false
      statusKey = ''
      trackingStatus()
    } catch (error) {
      if (closed || version !== loadVersion || error.name === 'AbortError')
        return
      loading = false
      emit()
      onError(
        'This 3D model could not load. Change the piece or use room-photo mode.'
      )
    }
  }
  session.addEventListener('end', cleanup, { once: true })
  signal.addEventListener('abort', end, { once: true })
  try {
    renderer = runtime.createRenderer
      ? runtime.createRenderer({ alpha: true, antialias: true })
      : new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.xr.enabled = true
    renderer.xr.setReferenceSpaceType('local')
    // Use the established XRWebGLLayer submission path on mobile AR. This is
    // an opt-in compatibility hook in our pinned r180 vendor copy.
    renderer.xr.preferWebGLLayer = typeof XRWebGLLayer !== 'undefined'
    if (renderer.debug)
      renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
        shaderError = [
          gl.getProgramInfoLog(program),
          gl.getShaderInfoLog(vertex),
          gl.getShaderInfoLog(fragment)
        ]
          .filter(Boolean)
          .join('\n')
          .slice(0, 1600)
        graphicsFailure()
      }
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    // XR uses its own framebuffer. Keep this canvas outside the HTML overlay
    // so a second DOM canvas cannot obscure the immersive scene.
    renderer.domElement.className = 'xr-canvas'
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.addEventListener('webglcontextlost', graphicsFailure)
    document.body.append(renderer.domElement)
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.01,
      30
    )
    // Metallic finishes need light from their surroundings as well as direct
    // lights. This neutral studio environment is not camera light estimation.
    const faces = [
      '#eee7d5',
      '#d8d6cd',
      '#fff9e9',
      '#7e7868',
      '#eee7da',
      '#d5d8d0'
    ].map(color => {
      const face = document.createElement('canvas')
      face.width = face.height = 16
      const context = face.getContext('2d')
      context.fillStyle = color
      context.fillRect(0, 0, 16, 16)
      return face
    })
    environment = new THREE.CubeTexture(faces)
    environment.colorSpace = THREE.SRGBColorSpace
    environment.needsUpdate = true
    scene.environment = environment
    scene.add(new THREE.HemisphereLight(0xfff5df, 0x625d51, 3))
    const light = new THREE.DirectionalLight(0xffffff, 2)
    light.position.set(1, 3, 2)
    scene.add(light)
    anchor = new THREE.Group()
    anchor.visible = false
    yawGroup = new THREE.Group()
    sizeGroup = new THREE.Group()
    anchor.add(yawGroup)
    yawGroup.add(sizeGroup)
    scene.add(anchor)
    reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.065, 0.085, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xd6b578, side: THREE.DoubleSide })
    )
    reticle.matrixAutoUpdate = false
    reticle.visible = false
    scene.add(reticle)
    await renderer.xr.setSession(session)
    const raycaster = new THREE.Raycaster()
    let gestureScale = 1, gestureRotation = 0
    gestures = bindStatueGestures(overlay, {
      oneFingerRotate: true,
      canStart(at, target) {
        if (closed || loading || !model || !anchor.visible || !previewEnabled ||
            target.closest?.('[data-xr-ui],.room-panel,dialog')) return false
        const view = renderer.xr.getCamera().cameras[0]
        if (!view) return false
        raycaster.setFromCamera(new THREE.Vector2(at.x / window.innerWidth * 2 - 1, 1 - at.y / window.innerHeight * 2), view)
        return raycaster.intersectObject(model, true).length > 0
      },
      onStart() {
        gestureScale = scale
        // Re-grabbing should continue from the angle actually on screen.
        gestureRotation = rotation = wrapDegrees(yawGroup.rotation.y * 180 / Math.PI)
      },
      onChange({ ratio, degrees }) {
        if (closed || loading || !model || !previewEnabled) return
        scale = clamp(gestureScale * ratio, .5, 2)
        rotation = wrapDegrees(gestureRotation + degrees)
        sizeGroup.scale.setScalar(scale)
        gestureDirty = true
      },
      onEnd() { if (!closed) { gestureDirty = false; emit() } }
    })
    if (closed || signal.aborted) {
      end()
      throw new DOMException('Cancelled', 'AbortError')
    }
    // Rendering and hit poses must use exactly the same reference space.
    referenceSpace = renderer.xr.getReferenceSpace()
    if (!referenceSpace)
      throw Error('The AR reference space could not be created')
    // Surface scanning must never block loading or rendering the real model.
    // If hit testing is absent/denied, manual 3D placement remains available.
    if (session.requestHitTestSource) {
      session
        .requestReferenceSpace('viewer')
        .then(space => session.requestHitTestSource({ space }))
        .then(source => {
          if (closed || signal.aborted) {
            source?.cancel()
            return
          }
          hitSource = source
          statusKey = ''
          trackingStatus()
        })
        .catch(() => {
          if (!closed) {
            hitSource = null
            statusKey = ''
            trackingStatus()
          }
        })
    }
    session.addEventListener('select', place)
    renderer.setAnimationLoop((time, frame) => {
      if (closed || !frame || graphicsLost) return
      const elapsed = previousFrameTime === null ? 1 / 60 : (time - previousFrameTime) / 1000
      previousFrameTime = time
      yawGroup.rotation.y = dampAngle(yawGroup.rotation.y, rotation * Math.PI / 180, elapsed)
      // Keep panel/slider writes off the high-frequency touch event path.
      if (gestureDirty && time - lastGestureEmit >= 80) {
        lastGestureEmit = time; gestureDirty = false; emit()
      }
      const viewerPose = frame.getViewerPose(referenceSpace)
      tracking = Boolean(viewerPose)
      let found = false
      if (tracking && placing && hitSource && previewEnabled) {
        for (const hit of frame.getHitTestResults(hitSource)) {
          const pose = hit.getPose(referenceSpace)
          if (!pose || !isHorizontal(pose.transform.matrix)) continue
          reticle.matrix.fromArray(pose.transform.matrix)
          found = true
          break
        }
      }
      reticle.visible = found && placing && !loading
      if (placing) {
        // Show the real model at the surface marker before committing it.
        if (previewEnabled && tracking && model && !loading) {
          const preview = previewFromViewer(
            viewerPose.transform.matrix,
            (parseFloat(currentProduct.height) / 100) * scale,
            distance
          )
          anchor.position.copy(
            found
              ? new THREE.Vector3().setFromMatrixPosition(reticle.matrix)
              : preview.position
          )
          anchor.quaternion.copy(preview.quaternion)
          anchor.visible = true
        } else anchor.visible = false
      } else {
        anchor.visible = tracking && Boolean(model) && !loading
      }
      hasSurface = found
      trackingStatus()
      try {
        renderer.render(scene, camera)
        if (++frameCount % 30 === 0) {
          const layer = renderer.xr.getBaseLayer?.(),
            view = renderer.xr.getCamera?.().cameras?.[0]
          const centre =
            modelCentre && anchor.visible
              ? modelCentre.clone().applyMatrix4(sizeGroup.matrixWorld)
              : null
          const projected = centre && view ? centre.project(view) : null
          const gl = renderer.getContext?.()
          renderDetails = {
            build: '20261031-7',
            model: currentProduct.name,
            modelReady: Boolean(model),
            tracking,
            surfaceFound: hasSurface,
            layer: layer?.framebufferWidth
              ? 'XRWebGLLayer'
              : layer?.textureWidth
                ? 'XRProjectionLayer'
                : 'unavailable',
            framebuffer: [
              layer?.framebufferWidth || layer?.textureWidth || 0,
              layer?.framebufferHeight || layer?.textureHeight || 0
            ],
            views: renderer.xr.getCamera?.().cameras?.length || 0,
            xrPresenting: Boolean(renderer.xr.isPresenting),
            blendMode: session.environmentBlendMode || 'unknown',
            glError: gl?.getError() ?? null,
            framebufferBound:
              layer?.framebuffer && gl
                ? gl.getParameter(gl.FRAMEBUFFER_BINDING) === layer.framebuffer
                : null,
            xrRenderTarget: Boolean(
              renderer.getRenderTarget?.()?.isXRRenderTarget
            ),
            drawCalls: renderer.info?.render.calls || 0,
            triangles: renderer.info?.render.triangles || 0,
            modelInView: projected
              ? Math.abs(projected.x) <= 1 &&
              Math.abs(projected.y) <= 1 &&
              projected.z >= -1 &&
              projected.z <= 1
              : null,
            graphicsLost,
            shaderError,
            frames: frameCount,
            browser: navigator.userAgent
          }
        }
      } catch {
        graphicsFailure()
      }
    })
    setProduct(product)
    return {
      setProduct,
      getDiagnostics() {
        return { ...renderDetails, graphicsLost, shaderError }
      },
      setDistance(value) {
        distance = clamp(value, 0.35, 2)
        emit()
      },
      setScale,
      setRotation,
      place,
      placeManual,
      move() {
        previewEnabled = true
        placed = false
        placing = true
        manuallyPlaced = false
        hasSurface = false
        trackingStatus()
      },
      remove() {
        previewEnabled = false
        placed = false
        placing = true
        manuallyPlaced = false
        hasSurface = false
        anchor.visible = false
        trackingStatus()
      },
      reset() {
        scale = 1
        rotation = 0
        distance = 0.65
        sizeGroup.scale.setScalar(1)
        yawGroup.rotation.y = 0
        this.move()
        emit()
      },
      end,
      // Physical camera pixels are intentionally not exposed by this engine.
      captureIncludesCamera: false
    }
  } catch (error) {
    try {
      await session.end()
    } catch {
      /* Session may already have ended. */
    }
    cleanup()
    throw error
  }
}
