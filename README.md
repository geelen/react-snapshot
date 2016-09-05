# React Snapshot

A zero-configuration pre-renderer for React apps. Starting by targetting Create React App (because it's great)

## The Premise

Server-side rendering is a big feature of React, but for most use cases it's a bit over the top. Personally, I think the sweet spot is taking static site snapshots of all your publicly-accessible pages & leaving anything requiring authentication as a normal, JS-driven Single Page App.

The snapshots still have the normal JS bundle included, so once that downloads the site will function exactly as before (i.e. instantaneous page transitions). But you serve real, functional HTML & CSS as soon as possible. It's good for SEO (yes Google crawls SPAs now but they still reward perf and this perfs like a banshee), it's good if your JS is broken or something render-blocking has a network fail, it's good for accessibility, it's good for Slackbot or Facebook to read your opengraph tags, it's just good.

This is a project to do that. Automatically, without any configuration, just smart defaults. Retrospective progressive enhancement.

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

## The Implementation

It's pretty simple in principle:

- Fire up the home page in a fake browser and snapshot the HTML once the page is rendered
- Follow every relative URL to crawl the whole site
- Repeat.

There's a few more steps to it, but not much.

- We move `build/index.html` to `build/200.html` at the beginning, because it's a nice convention. Hosts like [surge.sh](https://surge.sh) will render the snapshot for a URL if present or fall back to `200.html`, if you use a different host I'm sure you can make it do the same.
- `pushstate-server` is used to serve the `build` directory, for now. I think I'll switch that to `superstatic` though.
- The fake browser is JSDOM, set to execute any local scripts (same origin) in order to actually run your React code, but it'll ignore any third-party scripts (analytics or social widgets)
- We start a new JSDOM session for each URL to ensure that each page gets the absolute minimum HTML to render it.

## The Caveats

This is a hacky experiment at the moment. I would really like to see how far we can take this approach so things "just work" without ever adding config. Off the top of my head:

- [ ] Is starting at `/` and crawling sufficient? Might there be unreachable sections of your site?
- [ ] Should we exclude certain URLs? Maybe parse the `robots.txt` file?
- [ ] This doesn't pass down any state except what's contained in the markup. That feels like proper SSR to me, but if you have a use-case where you need it and want zero-config raise an issue.
- [ ] I'm using a regexp to parse URLs out of the HTML because I wrote this on a flight with no wifi and couldn't NPM install anything. We should use a real parser. You should submit a PR to use a real parser. That would be real swell.
- [ ] Should we clone the `build` directory to something like `snapshot` or `dist` instead of modifying it in-place?
- [ ] There's virtually no error checking things so will just explode in interesting ways. So yeah that should be fixed.
- [ ] Is JSDOM gonna hold us back at some point?
- [ ] If the React code is changing what it renders based on size of viewport then things may "pop in" once the JS loads. Anything driven by media queries should just work though. So stick to Media Queries.
- [ ] Does someone else want to take this idea and run with it I probably don't have time to :)

## The Alternatives

This should work for simple cases. For less simple cases, go with:

- Webpack Static Site Generator
- Gatsby or Phenomic if you're doing a bigger blog or something. Phenomic has service worker support & minimal bundles and all kinds of things, Gatsby is getting that stuff too.
- Actually run the whole thing server-side because you have more complex stuff to do.

## License

MIT I guess.