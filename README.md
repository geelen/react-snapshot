# 📸 React Snapshot

A zero-configuration static pre-renderer for React apps. Starting by targeting Create React App (because it's great)

## The Premise

Server-side rendering is a big feature of React, but for most apps it can be more trouble than its worth. Personally, I think the sweet spot is taking static site snapshots of all your publicly-accessible pages & leaving anything requiring authentication as a normal, JS-driven Single Page App.

This is a project to do that. Automatically, without any configuration, just smart defaults. **Retrospective progressive enhancement.**

The snapshots still have the normal JS bundle included, so once that downloads the site will function exactly as before (i.e. instantaneous page transitions), but you serve real, functional HTML & CSS as soon as possible. It's good for SEO (yes Google crawls SPAs now but they still reward perf and this perfs like a banshee), it's good if your JS is broken or something render-blocking has a network fail, it's good for accessibility, it's good for Slackbot or Facebook to read your opengraph tags, it's just good.

## The How To

- First, `npm i -D react-snapshot`
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

This calls `ReactDOM.render` in development and `ReactDOMServer.renderToString` when prerendering. If I can make this invisible I will but I can't think how at the moment.

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

## The Implementation

It's pretty simple in principle:

- Fire up the home page in a fake browser and snapshot the HTML once the page is rendered
- Follow every relative URL to crawl the whole site
- Repeat.

There's a few more steps to it, but not much.

React-snapshot will crawl all links that it finds. You can create "site map" page, which will contain links to all pages.

- We move `build/index.html` to `build/200.html` at the beginning, because it's a nice convention. Hosts like [surge.sh](https://surge.sh) understand this, serving `200.html` if no snapshot exists for a URL. If you use a different host I'm sure you can make it do the same.
- `pushstate-server` is used to serve the `build` directory & serving `200.html` by default
- The fake browser is JSDOM, set to execute any local scripts (same origin) in order to actually run your React code, but it'll ignore any third-party scripts (analytics or social widgets)
- We start a new JSDOM session for each URL to ensure that each page gets the absolute minimum HTML to render it.

## The Caveats

This is a hacky experiment at the moment. I would really like to see how far we can take this approach so things "just work" without ever adding config. Off the top of my head:

- [x] ~~Waiting on [pushstate-server#29](https://github.com/scottcorgan/pushstate-server/pull/29). Right now `pushstate-server` serves `200.html` _even if_ a HTML snapshot is present. So once you've run `react-snapshot`, you have to switch to `http-server` or `superstatic` to test if it worked. Or you could just push to [surge.sh](https://surge.sh) each time, which isn't too bad.~~
- [x] ~~Is starting at `/` and crawling sufficient? Might there be unreachable sections of your site?~~
- [x] ~~Should we exclude certain URLs? Maybe parse the `robots.txt` file?~~
- [ ] What if you don't want the `200.html` pushstate fallback? What if you want to remove the bundle (effectively making this a static site generator)?
- [ ] This doesn't pass down any state except what's contained in the markup. That feels ok for simple use-cases (you can always roll your own) but if you have a use-case where you need it and want zero-config raise an issue.
- [x] #2 ~~I'm using a regexp to parse URLs out of the HTML because I wrote this on a flight with no wifi and couldn't NPM install anything. We should use a real parser. You should submit a PR to use a real parser. That would be real swell.~~
- [ ] Should we clone the `build` directory to something like `snapshot` or `dist` instead of modifying it in-place?
- [ ] There's virtually no error checking things so will just explode in interesting ways. So yeah that should be fixed.
- [ ] Is JSDOM gonna hold us back at some point?
- [ ] If the React code is changing what it renders based on size of viewport then things may "pop in" once the JS loads. Anything driven by media queries should just work though. So stick to Media Queries, I guess?
- [ ] Does someone else want to take this idea and run with it? I would be 100% happy to not be the maintainer of this project :)

## The Alternatives

This should work for simple cases. For less simple cases, go with:

- [Webpack Static Site Generator Plugin](https://github.com/markdalgleish/static-site-generator-webpack-plugin)
- [Gatsby](https://github.com/gatsbyjs/gatsby) or [Phenomic](https://phenomic.io/) if you're doing something bigger or more structured. Phenomic has service worker support & minimal bundles and all kinds of things, Gatsby is getting that stuff too.
- Actually run a server-side React node server because you have more complex stuff to do, like pre-rendering stuff behind a login.

## License

MIT
