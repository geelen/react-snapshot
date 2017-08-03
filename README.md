# 📸 React Snapshot

A zero-configuration static pre-renderer for React apps, built for Create React App (because it's great)

## The Premise

Server-side rendering is a big feature of React, but for most apps it can be more trouble than its worth. You have to choose between serving your users a blank page until the JS loads, or set up the infrastructure required to generate HTML on a server—suddenly your application code needs to be aware that some of the time browser APIs will be available and other times it's NodeJS & you need to start describing more precisely which routes load which data. Either you optimise for Developer Experience (DX) or User Experience (UX), which is a bad tradeoff to be making.

Thankfully, the same mechanics that make React work as a static HTML page rendered by a server lets us do something much simpler—rather than rendering HTML dynamically on a server, render it ahead of time during the build & deployment phase. Then, take these static HTML snapshots and host them anywhere, no server required.

This is a project to do that. Automatically, without any configuration, and only a few tiny changes to your application code.

The snapshots still have the normal JS bundle included, so once that downloads the site will function exactly as before (i.e. instantaneous page transitions), but you serve real, functional HTML & CSS as soon as possible. It's good for SEO (yes Google crawls SPAs now but they still reward perf and this perfs like a banshee), it's good if your JS is broken or something render-blocking has a network fail, it's good for accessibility, it's good for Slackbot or Facebook to read your opengraph tags, it's just good.

## The How To

- First, `npm i -D react-snapshot@next` (for v2)
- Second, open your package.json and change `"scripts"` from

```diff
- "build": "react-scripts build"
+ "build": "react-scripts build && react-snapshot"
```

- Third, change your usage of `react-dom`:

```diff
- import ReactDOM from 'react-dom';
+ import { render } from 'react-snapshot';

- ReactDOM.render(
+ render(
    <App/>,
    document.getElementById('root')
  );
```

For a static site, that's it! During `build`, react-snapshot will load up your site using JSDOM, crawl it to find all the pages, render each, calculate the React checksum to minimise work on the client, and save the files out to be served by something like [surge.sh](https://surge.sh).

## Dynamic Data

If a route has to fetch data from somewhere, you need to tell react-snapshot about it. But thankfully, that's as easy as:

```diff
+ import { snapshot } from 'react-snapshot'

class Home extends React.Component {
  state = { quotes: null }

  componentWillMount() {
+   snapshot(() => (
      fetch('/api/quotes')
        .then(response => response.json())
+   ))
    .then(quotes => {
      this.setState({ quotes })
    })
  }

  render() {
    return this.state
    return (
      <div className="Quotes">
        {
          quotes && quotes.map((quote, i) => <Quote key={i} quote={quote}/>)
        }
      </div>
    )
  }
}
```

Wrap any async process you want to track in a `snapshot` call and it'll be tracked. During deployment, the fetch is performed, the return value is stored & sent as JSON in the HTML snapshot. When the app gets booted on the client, that same snapshot method short-circuits, immediately calling the .then and the state gets populated before the render method is called. This means there's no flash, the checksum matches, and everything is JUST GREAT™.

*Note: you have to use `componentWillMount` instead of `componentDidMount`, since the latter runs *after* the render method, and you'll get a flash.

Since this pattern is quite common, there's also the `Snapshot` higher-order component that lets you treat async dependencies as props:

```js
const Home = ({ quotes }) => (
  <div className="Quotes">
    {
      quotes && quotes.map((quote, i) => <Quote key={i} quote={quote}/>)
    }
  </div>
)

export default Snapshot({
  quotes: () => fetch('/api/quotes').then(resp => resp.json())
}).rendering(Home)
```

## Options

You can specify additional paths as entry points for crawling that would otherwise not be found. It's also possible to exclude particular paths from crawling. Simply add a section called `"reactSnapshot"` to your package.json.

```
  "reactSnapshot": {
    "include": [
      "/other-path",
      "/another/nested-path"
    ],
    "exclude": [
      "/signup",
      "/other-path/exclude-me/**"
    ],
    "snapshotDelay": 300
  }
```

Note that exclude can be passed a glob, but include cannot.

The default snapshot delay is 50ms, and this can be changed to suit your app's requirements.

## The Demo

Check out [create-react-app-snapshot.surge.sh](https://create-react-app-snapshot.surge.sh) for a live version or [geelen/create-react-app-snapshot](https://github.com/geelen/create-react-app-snapshot) for how it was built, starting from [create-react-app](https://github.com/facebookincubator/create-react-app)'s awesome baseline. No ejecting necessary, either.

The [diff from the original create-react-app code](https://github.com/geelen/create-react-app-snapshot/compare/303f774...master) might be enlightening to you as well.


## The Alternatives

This should work for simple cases. For less simple cases, go with:

- [Webpack Static Site Generator Plugin](https://github.com/markdalgleish/static-site-generator-webpack-plugin)
- [Gatsby](https://github.com/gatsbyjs/gatsby) or [Phenomic](https://phenomic.io/) if you're doing something bigger or more structured. Phenomic has service worker support & minimal bundles and all kinds of things, Gatsby is getting that stuff too.
- Actually run a server-side React node server because you have more complex stuff to do, like pre-rendering stuff behind a login.

## License

MIT
