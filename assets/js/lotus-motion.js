document.querySelectorAll('.lotus-petal').forEach(petal => {
  const clipId = petal.querySelector('use').getAttribute('clip-path').slice(5, -1)
  const hitArea = document.getElementById(clipId).firstElementChild.cloneNode()
  hitArea.classList.add('lotus-petal-hit')
  petal.ownerSVGElement.append(hitArea)

  let settleTimer
  hitArea.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || event.movementX === 0 ||
        document.documentElement.hasAttribute('data-a11y-motion') ||
        matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const tilt = Math.sign(event.movementX) * Math.min(3, 1.5 + Math.abs(event.movementX) * 0.14)
    petal.classList.add('is-reacting')
    petal.style.setProperty('--cursor-tilt', `${tilt}deg`)

    clearTimeout(settleTimer)
    settleTimer = setTimeout(() => {
      petal.classList.remove('is-reacting')
      petal.style.removeProperty('--cursor-tilt')
    }, 300)
  })
})
