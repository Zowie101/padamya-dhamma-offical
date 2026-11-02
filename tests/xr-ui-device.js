// QA only. Simulates an XR device; never loaded by the live website.
import * as THREE from '../assets/vendor/three/three.module.js?v=20261031-6';
let layer,real,active,endCalls=0,stream;const space={},viewer=new THREE.Matrix4().makeTranslation(0,1.5,0);
class TestLayer{
 constructor(xrSession,gl){
  layer=this;real={getContext:()=>gl,domElement:gl.canvas};this.gl=gl;this.framebufferWidth=gl.drawingBufferWidth;this.framebufferHeight=gl.drawingBufferHeight;this.ignoreDepthValues=true;this.fixedFoveation=0
  const old=gl.getParameter(gl.FRAMEBUFFER_BINDING),oldTexture=gl.getParameter(gl.TEXTURE_BINDING_2D),oldBuffer=gl.getParameter(gl.RENDERBUFFER_BINDING)
  this.framebuffer=gl.createFramebuffer();this.texture=gl.createTexture();this.depth=gl.createRenderbuffer()
  gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,this.framebufferWidth,this.framebufferHeight,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR)
  gl.bindRenderbuffer(gl.RENDERBUFFER,this.depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,this.framebufferWidth,this.framebufferHeight)
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.texture,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,this.depth)
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Test XR framebuffer incomplete')
  gl.bindFramebuffer(gl.FRAMEBUFFER,old);gl.bindTexture(gl.TEXTURE_2D,oldTexture);gl.bindRenderbuffer(gl.RENDERBUFFER,oldBuffer)
 }
 getViewport(){return{x:0,y:0,width:this.framebufferWidth,height:this.framebufferHeight}}
 dispose(){this.gl.deleteFramebuffer(this.framebuffer);this.gl.deleteTexture(this.texture);this.gl.deleteRenderbuffer(this.depth)}
}

Object.defineProperty(window,'XRWebGLLayer',{configurable:true,value:TestLayer});
Object.defineProperty(window,'XRWebGLBinding',{configurable:true,value:class{createProjectionLayer(){throw Error('Unexpected projection layer')}}});
WebGL2RenderingContext.prototype.makeXRCompatible=async()=>{};
// Preserve the simulated XR framebuffer mirror for browser screenshots.
const getContext=HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext=function(type,options){return getContext.call(this,type,type==='webgl2'?{...options,preserveDrawingBuffer:true}:options)};
class TestSession extends EventTarget{
 constructor(){super();this.enabledFeatures=['dom-overlay','hit-test'];this.environmentBlendMode='alpha-blend';this.inputSources=[];this.renderState={depthNear:.1,depthFar:1000};this.visibilityState='visible';this.ended=false}
 updateRenderState(update){Object.assign(this.renderState,update)}
 requestReferenceSpace(){return Promise.resolve(space)}
 requestHitTestSource(){return Promise.resolve({cancel(){}})}
 requestAnimationFrame(callback){return window.requestAnimationFrame(time=>{if(this.ended)return;callback(time,this.frame());if(!this.ended)mirror()})}
 cancelAnimationFrame(handle){window.cancelAnimationFrame(handle)}
 frame(){
  const camera=new THREE.PerspectiveCamera(60,layer.framebufferWidth/layer.framebufferHeight,this.renderState.depthNear,this.renderState.depthFar)
  return{session:this,getViewerPose:()=>({transform:{matrix:viewer.elements},views:[{eye:'none',transform:{matrix:viewer.elements},projectionMatrix:camera.projectionMatrix.elements}]}),getHitTestResults:()=> [{getPose:()=>({transform:{matrix:new THREE.Matrix4().makeTranslation(0,1.3,-.65).elements}})}]}
 }
 async end(){endCalls++;await new Promise(r=>setTimeout(r,35));this.ended=true;this.dispatchEvent(new Event('end'));layer?.dispose()}
}

function mirror(){const gl=layer.gl,r=gl.getParameter(gl.READ_FRAMEBUFFER_BINDING),d=gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING);gl.bindFramebuffer(gl.READ_FRAMEBUFFER,layer.framebuffer);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,null);gl.blitFramebuffer(0,0,layer.framebufferWidth,layer.framebufferHeight,0,0,gl.canvas.width,gl.canvas.height,gl.COLOR_BUFFER_BIT,gl.NEAREST);gl.bindFramebuffer(gl.READ_FRAMEBUFFER,r);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,d);}
Object.defineProperty(navigator,'xr',{configurable:true,value:{isSessionSupported:async()=>true,requestSession:async()=>active=new TestSession()}});
Object.defineProperty(navigator.mediaDevices,'getUserMedia',{configurable:true,value:async()=>{if(active&&!active.ended)throw Error('Camera requested before XR ended');const c=document.createElement('canvas');c.width=720;c.height=1280;const ctx=c.getContext('2d');ctx.fillStyle='#bcc6b4';ctx.fillRect(0,0,720,1280);ctx.fillStyle='#806c51';ctx.fillRect(0,860,720,420);ctx.fillStyle='#fff';ctx.font='24px sans-serif';ctx.fillText('SIMULATED CAMERA',130,180);stream=c.captureStream(15);parent.document.querySelector('#status').textContent='Camera after XR cleanup · '+endCalls+' end request';return stream;}});
document.addEventListener('click',async e=>{const a=e.target.closest('a[download]');if(!a)return;e.preventDefault();const b=await(await fetch(a.href)).blob(),img=await createImageBitmap(b);parent.document.querySelector('#status').textContent='PNG exported · '+img.width+' × '+img.height;img.close();},{capture:true});
addEventListener('pagehide',()=>stream?.getTracks().forEach(t=>t.stop()));
