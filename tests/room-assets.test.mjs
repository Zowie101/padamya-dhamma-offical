import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'

test('all six Room Studio products retain their own real model and transparent views', async () => {
  const source = await fs.readFile(new URL('../assets/js/app.js', import.meta.url), 'utf8')
  const products = vm.runInNewContext(source.split('const CART_KEY')[0] + ';PRODUCTS')
  assert.equal(products.length, 6); assert.equal(new Set(products.map(p => p.model)).size, 6)
  for (const p of products) {
    assert.ok(p.arModel, 'each statue needs its own mobile AR asset')
    const ar = await fs.readFile(new URL('../' + p.arModel, import.meta.url))
    assert.equal(ar.toString('ascii',0,4),'glTF')
    assert.equal(ar.readUInt32LE(8),ar.length)
    assert.equal(p.previewModel, p.arModel, 'all 3D views reuse the same optimized download')
    assert.ok(ar.length < 5 * 1024 * 1024, 'preview model stays below 5 MiB')
    const originalStats = await fs.stat(new URL('../' + p.model, import.meta.url))
    assert.ok(ar.length < originalStats.size * .15, 'save at least 85% against the full-size product model')
    const arDoc = JSON.parse(ar.subarray(20,20+ar.readUInt32LE(12)).toString('utf8'))
    assert.ok(!arDoc.extensionsRequired?.length, 'AR should not require an extra compression decoder')
    const primitive = arDoc.meshes[0].primitives[0]
    const prior = await fs.readFile(new URL('../assets/models/ar/' + p.assetSet + '.glb', import.meta.url))
    const priorDoc = JSON.parse(prior.subarray(20,20+prior.readUInt32LE(12)).toString('utf8'))
    assert.deepEqual(arDoc.nodes, priorDoc.nodes, 'keep original scene placement and transforms')
    const before = priorDoc.accessors[priorDoc.meshes[0].primitives[0].attributes.POSITION]
    const after = arDoc.accessors[primitive.attributes.POSITION]
    for (let axis=0;axis<3;axis++) {
      const tolerance = (before.max[axis]-before.min[axis]) * .002
      assert.ok(Math.abs(after.min[axis]-before.min[axis]) <= tolerance, 'preserve model bounds for grounding')
      assert.ok(Math.abs(after.max[axis]-before.max[axis]) <= tolerance, 'preserve model bounds for scale')
    }
    const poster = await fs.readFile(new URL('../' + p.previewImage, import.meta.url))
    assert.equal(poster.toString('ascii',8,12),'WEBP')
    assert.ok(poster.length < 150000, 'poster stays lightweight')
    assert.ok(arDoc.accessors[primitive.attributes.POSITION].count < 150000, 'mobile vertex budget')
    for(const image of arDoc.images) {
      const view = arDoc.bufferViews[image.bufferView], start = 28+ar.readUInt32LE(12)+(view.byteOffset||0)
      if(image.mimeType === 'image/png') {
        assert.equal(ar.toString('hex',start,start+8),'89504e470d0a1a0a')
        assert.ok(ar.readUInt32BE(start+16)<=1024 && ar.readUInt32BE(start+20)<=1024, 'mobile texture budget')
      } else {
        assert.equal(image.mimeType, 'image/jpeg', 'use standard glTF texture formats without extra decoders')
        assert.equal(ar.readUInt16BE(start), 0xffd8, 'valid JPEG header')
      }
    }
    assert.equal(p.images.length, 3); assert.deepEqual(Array.from(p.imageLabels), ['Front', 'Side', 'Back'])
    for (const name of p.images) {
      const handle = await fs.open(new URL('../' + name, import.meta.url))
      const header = Buffer.alloc(26); await handle.read(header, 0, 26, 0); await handle.close()
      assert.equal(header.toString('hex', 0, 8), '89504e470d0a1a0a', name)
      assert.equal(header[25], 6, `${name} must preserve RGBA transparency`)
    }
    const handle = await fs.open(new URL('../' + p.model, import.meta.url))
    try {
      const header = Buffer.alloc(20); await handle.read(header, 0, 20, 0)
      assert.equal(header.toString('ascii', 0, 4), 'glTF'); assert.equal(header.readUInt32LE(4), 2)
      const json = Buffer.alloc(header.readUInt32LE(12)); await handle.read(json, 0, json.length, 20)
      const model = JSON.parse(json.toString('utf8'))
      assert.ok(model.meshes.length > 0); assert.ok(!model.extensionsRequired?.length)
      assert.ok(model.images.every(image => image.bufferView !== undefined), 'product textures must be embedded')
    } finally { await handle.close() }
  }
})
