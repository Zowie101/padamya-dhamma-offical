/* One initial reveal; compositor animations pause offscreen and in hidden tabs. */
;(()=>{
 const hero=document.querySelector('.bodhi-banner'),scene=hero?.querySelector('.bodhi-scene');if(!scene)return
 const media=matchMedia('(prefers-reduced-motion: reduce)'),small=matchMedia('(max-width:700px)'),abort=new AbortController()
 let visible=true,frame=0,disposed=false
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
 function sync(){scene.classList.toggle('is-paused',document.hidden||!visible);if(reduced())scene.classList.add('is-grown');schedule()}
 function update(){frame=0;if(disposed)return;scene.style.setProperty('--bodhi-height',`${hero.offsetHeight+60}px`);const progress=reduced()?0:Math.min(1,Math.max(0,-hero.getBoundingClientRect().top/hero.offsetHeight));scene.style.setProperty('--bodhi-y',`${progress*(small.matches?30:65)}px`);scene.style.setProperty('--bodhi-scale',String(1+progress*.025));scene.style.setProperty('--bodhi-fade',String(1-progress*.5))}
 function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(update)}
 const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()},{threshold:.02,rootMargin:'-82px 0px 0px 0px'}):null
 observer?.observe(hero)
 scene.classList.add('is-enhanced');particles();sync()
 const images=[...scene.querySelectorAll('img')]
 Promise.all(images.map(img=>img.decode?img.decode():new Promise((resolve,reject)=>{if(img.complete){img.naturalWidth?resolve():reject();return}img.addEventListener('load',resolve,{once:true});img.addEventListener('error',reject,{once:true})}))).then(()=>{
  if(disposed)return
  scene.querySelector('.bodhi-canopy img').addEventListener('animationend',event=>{if(event.animationName==='bodhi-canopy-open')scene.classList.add('is-grown')},{once:true,signal:abort.signal})
  scene.classList.add('is-ready');if(reduced())scene.classList.add('is-grown')
 }).catch(()=>{scene.hidden=true})
 window.addEventListener('scroll',()=>{if(visible&&!reduced())schedule()},{passive:true,signal:abort.signal})
 window.addEventListener('resize',schedule,{passive:true,signal:abort.signal})
 window.addEventListener('sacredform:accessibilitychange',sync,{signal:abort.signal})
 document.addEventListener('visibilitychange',sync,{signal:abort.signal})
 media.addEventListener('change',sync,{signal:abort.signal});small.addEventListener('change',()=>{particles();schedule()},{signal:abort.signal})
 window.addEventListener('pageshow',sync,{signal:abort.signal})
 window.addEventListener('pagehide',event=>{scene.classList.add('is-paused');if(event.persisted)return;disposed=true;abort.abort();observer?.disconnect();cancelAnimationFrame(frame)},{signal:abort.signal})
})()
