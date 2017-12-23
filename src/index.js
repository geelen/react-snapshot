import { render as renderToDom, hydrate } from 'react-dom';

export const render = (rootComponent, domElement) => {
  if (navigator.userAgent === 'ReactSnapshot' && window && window.reactSnapshotRender) {
    domElement.innerHTML = window.reactSnapshotRender(rootComponent);
  } else {
    if (domElement.hasChildNodes()) {
      hydrate(rootComponent, domElement)
    } else {
      renderToDom(rootComponent, domElement)
    }
  }
}
