import * as THREE from '../vendor/three/three.module.js?v=20261031-6'

// A real 3D preview at the camera's aim point. This is not a surface hit.
export function previewFromViewer(poseMatrix, height, distance = 0.65) {
  const matrix = new THREE.Matrix4().fromArray(poseMatrix)
  const forward = new THREE.Vector3(0, 0, -1).transformDirection(matrix)
  const position = new THREE.Vector3()
    .setFromMatrixPosition(matrix)
    .addScaledVector(forward, distance)
  position.y -= height / 2
  const yaw = Math.atan2(-forward.x, -forward.z)
  const quaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    yaw
  )
  return { position, quaternion }
}

// Use a parent pivot so imported scene transforms cannot displace the model.
export function prepareRoomModel(root, listedHeight) {
  root.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(root, true)
  const size = bounds.getSize(new THREE.Vector3()),
    centre = bounds.getCenter(new THREE.Vector3())
  const metres = parseFloat(listedHeight) / 100
  if (
    !Number.isFinite(size.y) ||
    size.y <= 0 ||
    !Number.isFinite(metres) ||
    metres <= 0
  )
    throw Error('Invalid statue dimensions')
  const offset = new THREE.Group()
  offset.position.set(-centre.x, -bounds.min.y, -centre.z)
  offset.add(root)
  const normalized = new THREE.Group()
  normalized.add(offset)
  normalized.scale.setScalar(metres / size.y)
  normalized.updateMatrixWorld(true)
  return normalized
}
