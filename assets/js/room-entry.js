// Keep the product page behind the mode chooser until a preview is selected.
const dialog = document.getElementById('roomEntry')
const api = window.SacredForm
let destination
document.addEventListener('click', event => {
  const link = event.target.closest('#viewInRoom')
  if (
    !link ||
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey
  )
    return
  event.preventDefault()
  destination = new URL(link.href)
  const product = api.getProduct(destination.searchParams.get('piece'))
  dialog.querySelector('#welcomeProductImage').src = product.image
  dialog.querySelector('#welcomeProductImage').alt = product.name
  dialog.querySelector('#welcomeArHint').textContent =
    'Choose live 3D AR or a manual camera overlay.'
  dialog.showModal()
})
dialog.querySelector('#welcomeClose').addEventListener('click', event => {
  event.preventDefault()
  dialog.close()
})
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const r = dialog.getBoundingClientRect()
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      dialog.close()
  }
})
for (const [id, entry] of [
  ['choosePhoto', 'upload'],
  ['chooseLive', 'live'],
  ['chooseSample', 'sample']
]) {
  dialog.querySelector('#' + id).addEventListener('click', () => {
    destination.searchParams.set('entry', entry)
    dialog.close()
    if (window.SacredPageMotion) window.SacredPageMotion.navigate(destination.href)
    else location.assign(destination.href)
  })
}
