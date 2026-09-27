// View history is local to the current signed-in household and never includes
// credentials or form contents. Refreshing data does not create a back step.
export function createNavigationTrail(limit = 40) {
  let current = null, previous = [];
  const key = v => JSON.stringify([v.tab, v.activeSheet]);
  return {
    visit(view) {
      const next = structuredClone(view);
      if (current && key(current) !== key(next)) {
        previous.push(current);
        if (previous.length > limit) previous.shift();
      }
      current = next;
    },
    back() {
      if (!previous.length) return null;
      current = previous.pop();
      return structuredClone(current);
    },
    reset() { current = null; previous = []; },
    get length() { return previous.length; },
  };
}

export function isBackSwipe(start, end) {
  const dx = end.x - start.x, dy = end.y - start.y;
  return start.x >= 0 && start.x <= 24 && dx >= 72 && dx > Math.abs(dy) * 1.7;
}

export function installEdgeBack({canGoBack, goBack}) {
  let start = null, end = null, horizontal = false, suppressClickUntil = 0;
  document.addEventListener('touchstart', event => {
    start = null; horizontal = false;
    if (event.touches.length !== 1 || !canGoBack()) return;
    const t = event.touches[0];
    if (t.clientX > 24 || event.target.closest('input,select,textarea,[contenteditable=true]')) return;
    start = {x:t.clientX, y:t.clientY}; end = start;
  }, {passive:true, capture:true});
  document.addEventListener('touchmove', event => {
    if (!start) return;
    if (event.touches.length !== 1) { start = null; return; }
    const t = event.touches[0]; end = {x:t.clientX, y:t.clientY};
    const dx=end.x-start.x, dy=end.y-start.y;
    if (!horizontal) {
      if (Math.abs(dy)>12 && Math.abs(dy)>Math.abs(dx)) { start=null; return; }
      if (dx>12 && dx>Math.abs(dy)*1.7) horizontal=true;
      else if (dx < -12) { start=null; return; }
    }
    if (horizontal && event.cancelable) event.preventDefault();
  }, {passive:false, capture:true});
  document.addEventListener('touchend', event => {
    if (!start) return;
    const t=event.changedTouches[0];
    if(t) end={x:t.clientX,y:t.clientY};
    const accepted=horizontal && isBackSwipe(start,end);
    start=null;
    if (accepted && canGoBack()) {
      if(event.cancelable) event.preventDefault();
      goBack();
      suppressClickUntil=Date.now()+450;
    }
  }, {passive:false,capture:true});
  document.addEventListener('touchcancel',()=>{start=null;horizontal=false;},{passive:true});
  document.addEventListener('click',event=>{
    if(Date.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();}
  },true);
}
