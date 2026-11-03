/* A root-to-canopy growth timeline advances once, then reverses with scroll. */
;(()=>{
 const hero=document.querySelector('.bodhi-banner'),scene=hero?.querySelector('.bodhi-scene');if(!scene)return
 const media=matchMedia('(prefers-reduced-motion: reduce)'),small=matchMedia('(max-width:700px)'),abort=new AbortController()
 const duration=7600
 let visible=true,frame=0,disposed=false,ready=false,elapsed=0,lastTime=null
 const reduced=()=>window.SacredAccessibility?.reduceMotion()??media.matches
 function particles(){
  const leaves=scene.querySelector('.bodhi-leaves'),lights=scene.querySelector('.bodhi-fireflies');leaves.replaceChildren();lights.replaceChildren()
  for(let i=0;i<(small.matches?5:9);i++){
   const leaf=document.createElement('span');leaf.className='bodhi-leaf';leaf.innerHTML='<i></i>'
   leaf.style.cssText=`--x:${8+i*89/(small.matches?5:9)}%;--size:${small.matches?9+i%3:11+i%5}px;--duration:${13+i%4*2}s;--delay:${i*1.8}s;--drift:${i%2?-70:90}px;--spin:${i%2?-180:210}deg`;leaves.append(leaf)
  }
  for(let i=0;i<(small.matches?7:13);i++){
   const light=document.createElement('span');light.className='bodhi-firefly'
   light.style.cssText=`--x:${8+(i*37)%85}%;--y:${20+(i*19)%67}%;--size:${2+i%3}px;--duration:${7+i%5}s;--delay:-${i*.8}s;--drift:${i%2?-25:32}px`;lights.append(light)
  }
 }
 function sync(){scene.classList.toggle('is-paused',document.hidden||!visible);if(reduced()){elapsed=duration;scene.classList.add('has-grown')}lastTime=null;schedule()}
 function update(time){
  frame=0;if(disposed)return
  const running=ready&&visible&&!document.hidden&&!reduced()
  if(running&&elapsed<duration){if(lastTime!==null)elapsed=Math.min(duration,elapsed+Math.min(100,Math.max(0,time-lastTime)));lastTime=time}else lastTime=null
  scene.style.setProperty('--bodhi-height',`${hero.offsetHeight+60}px`)
  const progress=reduced()?0:Math.min(1,Math.max(0,-hero.getBoundingClientRect().top/hero.offsetHeight))
  const growth=reduced()?duration:elapsed*(1-progress)
  scene.style.setProperty('--growth-time',`${(growth/1000).toFixed(3)}s`)
  scene.style.setProperty('--growth-progress',String(growth/duration))
  scene.style.setProperty('--bodhi-y',`${progress*(small.matches?12:20)}px`)
  scene.style.setProperty('--bodhi-scale',String(1+progress*.015))
  scene.style.setProperty('--bodhi-fade',String(1-progress*.4))
  scene.classList.toggle('is-grown',growth>=duration-1)
  if(growth>=duration-1)scene.classList.add('has-grown')
  if(running&&elapsed<duration)schedule()
 }
 function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(update)}
 const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()},{threshold:.02,rootMargin:'-82px 0px 0px 0px'}):null
 observer?.observe(hero)
 scene.classList.add('is-enhanced');particles();sync()
 const images=[...scene.querySelectorAll('img')]
 Promise.all(images.map(img=>img.decode?img.decode():new Promise((resolve,reject)=>{if(img.complete){img.naturalWidth?resolve():reject();return}img.addEventListener('load',resolve,{once:true});img.addEventListener('error',reject,{once:true})}))).then(()=>{
  if(disposed)return
  ready=true;lastTime=null;scene.classList.add('is-ready');schedule()
 }).catch(()=>{scene.hidden=true})
 window.addEventListener('scroll',()=>{if(visible&&!reduced())schedule()},{passive:true,signal:abort.signal})
 window.addEventListener('resize',schedule,{passive:true,signal:abort.signal})
 window.addEventListener('sacredform:accessibilitychange',sync,{signal:abort.signal})
 document.addEventListener('visibilitychange',sync,{signal:abort.signal})
 media.addEventListener('change',sync,{signal:abort.signal});small.addEventListener('change',()=>{particles();schedule()},{signal:abort.signal})
 window.addEventListener('pageshow',sync,{signal:abort.signal})
 window.addEventListener('pagehide',event=>{scene.classList.add('is-paused');if(event.persisted)return;disposed=true;abort.abort();observer?.disconnect();cancelAnimationFrame(frame)},{signal:abort.signal})
})()
