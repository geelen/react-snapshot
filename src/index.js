import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';

export const render = (rootComponent, domElement) => {
  if (navigator.userAgent.match(/Node\.js/i) && window && window.reactSnapshotRender) {
    domElement.innerHTML = ReactDOMServer.renderToString(rootComponent)
    window.reactSnapshotRender()
  } else {
    ReactDOM.render(rootComponent, domElement)
  }
}
