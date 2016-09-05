import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';

export const render = (rootComponent, domElement) => {
  if (navigator.userAgent.match(/Node\.js/i)) {
    domElement.innerHTML = ReactDOMServer.renderToString(rootComponent)
  } else {
    ReactDOM.render(rootComponent, domElement)
  }
}
