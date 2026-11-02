// Build-time only. Originals remain untouched; no additional runtime decoder.
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { MeshoptSimplifier } from './ar-build/meshopt_simplifier.mjs'
const require = createRequire(import.meta.url)
let sharp
try { sharp = require('sharp') } catch { sharp = require(path.resolve(path.dirname(process.execPath), '../node_modules/sharp')) }
await MeshoptSimplifier.ready
await fs.mkdir('assets/models/optimized', { recursive:true })
const report = []
for (let number=1;number<=6;number++) {
  const stem=`buddha_${number}`, source=await fs.readFile(`assets/models/ar/${stem}.glb`)
  const jsonLength=source.readUInt32LE(12), doc=JSON.parse(source.subarray(20,20+jsonLength).toString())
  const bin=source.subarray(20+jsonLength+8), views=doc.bufferViews.map(v=>Buffer.from(bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength)))
  const readAccessor=(index)=>{
    const a=doc.accessors[index], view=doc.bufferViews[a.bufferView]
    if(view.byteStride||a.sparse)throw Error('Interleaved/sparse input needs a general glTF tool')
    const Type=a.componentType===5126?Float32Array:a.componentType===5125?Uint32Array:null
    if(!Type)throw Error('Unexpected accessor component type')
    const dimensions={SCALAR:1,VEC2:2,VEC3:3}[a.type]
    return new Type(views[a.bufferView].buffer.slice(views[a.bufferView].byteOffset+(a.byteOffset||0),views[a.bufferView].byteOffset+(a.byteOffset||0)+a.count*dimensions*4))
  }
  const primitive=doc.meshes[0].primitives[0]
  if(doc.meshes.length!==1||doc.meshes[0].primitives.length!==1)throw Error('Expected a single statue mesh')
  const positions=readAccessor(primitive.attributes.POSITION), originalIndices=readAccessor(primitive.indices)
  const [indices,error]=MeshoptSimplifier.simplify(originalIndices,positions,3,Math.floor(originalIndices.length*.5/3)*3,.0008,['LockBorder'])
  const oldVertices=[], remap=new Map(), compactIndices=new Uint32Array(indices.length)
  for(let i=0;i<indices.length;i++){
    const old=indices[i]
    if(!remap.has(old)){remap.set(old,oldVertices.length);oldVertices.push(old)}
    compactIndices[i]=remap.get(old)
  }
  for(const [semantic,index]of Object.entries(primitive.attributes)){
    const a=doc.accessors[index],original=readAccessor(index),stride={VEC2:2,VEC3:3}[a.type],reduced=new Float32Array(oldVertices.length*stride)
    if(!stride)throw Error('Unexpected statue attribute')
    for(let i=0;i<oldVertices.length;i++)for(let j=0;j<stride;j++)reduced[i*stride+j]=original[oldVertices[i]*stride+j]
    a.count=oldVertices.length;a.byteOffset=0
    if(semantic==='POSITION'){
      a.min=[Infinity,Infinity,Infinity];a.max=[-Infinity,-Infinity,-Infinity]
      for(let i=0;i<reduced.length;i+=3)for(let j=0;j<3;j++){a.min[j]=Math.min(a.min[j],reduced[i+j]);a.max[j]=Math.max(a.max[j],reduced[i+j])}
    }else{delete a.min;delete a.max}
    views[a.bufferView]=Buffer.from(reduced.buffer)
  }
  const indexAccessor=doc.accessors[primitive.indices]
  indexAccessor.count=compactIndices.length;indexAccessor.byteOffset=0;indexAccessor.min=[0];indexAccessor.max=[oldVertices.length-1]
  const packedIndices=oldVertices.length<=65535?new Uint16Array(compactIndices):compactIndices
  indexAccessor.componentType=oldVertices.length<=65535?5123:5125
  views[indexAccessor.bufferView]=Buffer.from(packedIndices.buffer)
  const colourImages=new Set(doc.materials.flatMap(m=>[m.pbrMetallicRoughness?.baseColorTexture?.index,m.pbrMetallicRoughness?.metallicRoughnessTexture?.index]).filter(i=>i!==undefined).map(i=>doc.textures[i].source))
  for(const [index,image] of doc.images.entries()){
    const pipeline=sharp(views[image.bufferView]).resize(1024,1024,{fit:'inside',withoutEnlargement:true})
    if(colourImages.has(index)){
      views[image.bufferView]=await pipeline.removeAlpha().jpeg({quality:94,chromaSubsampling:'4:4:4'}).toBuffer()
      image.mimeType='image/jpeg'
    }else{
      views[image.bufferView]=await pipeline.png({compressionLevel:9}).toBuffer()
      image.mimeType='image/png'
    }
  }
  let offset=0;const chunks=[]
  for(let i=0;i<views.length;i++){
    doc.bufferViews[i].byteOffset=offset;doc.bufferViews[i].byteLength=views[i].length
    chunks.push(views[i]);offset+=views[i].length
    const padding=(4-offset%4)%4;if(padding){chunks.push(Buffer.alloc(padding));offset+=padding}
  }
  doc.buffers[0].byteLength=offset;doc.asset.generator='Sacred Form optimized preview + AR / meshoptimizer 0.25.0 + Sharp'
  const json=Buffer.from(JSON.stringify(doc)), paddedJson=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)])
  const binary=Buffer.concat(chunks),header=Buffer.alloc(20),binaryHeader=Buffer.alloc(8)
  header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+paddedJson.length+binary.length,8);header.writeUInt32LE(paddedJson.length,12);header.write('JSON',16)
  binaryHeader.writeUInt32LE(binary.length);binaryHeader.writeUInt32LE(0x004e4942,4)
  const output=Buffer.concat([header,paddedJson,binaryHeader,binary]);await fs.writeFile(`assets/models/optimized/${stem}.glb`,output)
  const entry={asset:stem,originalBytes:source.length,optimizedBytes:output.length,originalVertices:positions.length/3,optimizedVertices:oldVertices.length,originalTriangles:originalIndices.length/3,optimizedTriangles:indices.length/3,error}
  report.push(entry);console.log(JSON.stringify(entry))
}
await fs.writeFile('assets/models/optimized/build-report.json',JSON.stringify(report,null,2)+'\n')
