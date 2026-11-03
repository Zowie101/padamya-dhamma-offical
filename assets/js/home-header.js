/* Home-only glass navigation: normal storefront styling resumes below the hero. */
;(()=>{
 const hero=document.querySelector('.shwedagon-hero'),header=document.querySelector('body.shwedagon-home > .site-header')
 if(!hero||!header)return
 const abort=new AbortController();let frame=0,disposed=false
 function update(){frame=0;if(disposed)return;header.classList.toggle('is-over-home-hero',hero.getBoundingClientRect().bottom>header.getBoundingClientRect().height+1)}
 function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(update)}
 const observer='ResizeObserver'in window?new ResizeObserver(schedule):null
 observer?.observe(hero);observer?.observe(header)
 window.addEventListener('scroll',schedule,{passive:true,signal:abort.signal})
 window.addEventListener('resize',schedule,{passive:true,signal:abort.signal})
 window.addEventListener('pageshow',schedule,{signal:abort.signal})
 window.addEventListener('pagehide',event=>{if(event.persisted)return;disposed=true;abort.abort();observer?.disconnect();cancelAnimationFrame(frame)},{signal:abort.signal})
 update()
})()
