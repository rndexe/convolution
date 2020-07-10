var view = {
  list: document.querySelector('ul'),
  content: document.querySelector('#content'),
  contentClose: document.querySelector('#content > button'),
  modal: document.body.querySelector('aside'),
  playPause: document.body.querySelector('#playPause'),
  audioSource: document.body.querySelector('#source'),
}
var audioConvolver = new AudioConvolver();
audioConvolver.buffersPromises.then(_ => {
  view.playPause.textContent = 'Enter';
  view.playPause.removeAttribute('disabled');
})
function showOverlay(e) {
  if (e.target.tagName !== "INPUT") return;
  view.content.classList.add("overlay");
  // view.content.querySelector('img').src = e.target.parentElement.querySelector('img').src;
  view.content.querySelector("h4").textContent = e.target.dataset.title;
  view.content.querySelector("p").textContent = e.target.dataset.text;
}
function handleImpulseSelection(e) {
  if (e.target.tagName !== "INPUT") return;
  const impulseIdx = Number(e.target.value) - 1;
  if(impulseIdx !== audioConvolver.impulseIdx) {
    showOverlay(e);
    audioConvolver.updateImpulse(impulseIdx);
  } else {
    e.target.checked = false;
    audioConvolver.removeImpulse();
  }
}
function init() {
  view.modal.style.display = 'none';
  audioConvolver.setup(view.audioSource);
}
// view.list.addEventListener('change', handleImpulseSelection);
view.list.addEventListener('click', handleImpulseSelection);
view.contentClose.addEventListener('click', function() {
  content.classList.remove('overlay');
});
view.playPause.addEventListener('click', init);