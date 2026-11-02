import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from '../assets/vendor/three/three.module.js'
import { prepareRoomModel, previewFromViewer } from '../assets/js/room-model.mjs'

test('3D preview stays in front of the viewer without requiring a surface hit', () => {
  for (const yaw of [0, Math.PI / 2, -Math.PI / 2, Math.PI]) {
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(3, 1.5, -2),
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(-0.25, yaw, 0, 'YXZ')
      ),
      new THREE.Vector3(1, 1, 1)
    )
    const preview = previewFromViewer(matrix.elements, 0.28, 0.65)
    const centre = preview.position.clone().add(new THREE.Vector3(0, 0.14, 0))
    const local = centre.clone().applyMatrix4(matrix.clone().invert())
    assert.ok(Math.abs(local.x) < 1e-8 && Math.abs(local.y) < 1e-8)
    assert.ok(
      Math.abs(local.z + 0.65) < 1e-8,
      'model centre must be ahead of the camera'
    )
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(preview.quaternion)
    assert.ok(Math.abs(up.y - 1) < 1e-8, 'statue must remain upright')
  }
})

test('AR grounding preserves imported root transforms and normalizes height in metres', () => {
  for (const height of [15, 18, 22, 25, 28, 32]) {
    const root = new THREE.Group()
    root.position.set(20, -9, 3)
    root.scale.set(2, 3, 4)
    root.rotation.y = 0.7
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 4, 3),
      new THREE.MeshStandardMaterial()
    )
    mesh.position.set(-4, 7, 2)
    root.add(mesh)
    const normalized = prepareRoomModel(root, `${height} cm`)
    const bounds = new THREE.Box3().setFromObject(normalized, true)
    assert.ok(Math.abs(bounds.min.y) < 1e-8)
    assert.ok(
      Math.abs(bounds.getSize(new THREE.Vector3()).y - height / 100) < 1e-8
    )
    const centre = bounds.getCenter(new THREE.Vector3())
    assert.ok(Math.abs(centre.x) < 1e-8 && Math.abs(centre.z) < 1e-8)
    mesh.geometry.dispose()
    mesh.material.dispose()
  }
})
