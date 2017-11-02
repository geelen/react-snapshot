# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.2.0] - 2017-11-02

- Upgraded peer dependencies to include React 16 [#71](https://github.com/geelen/react-snapshot/pull/71)
- Added a package.json option to strip certain JS from the bundle [#58](https://github.com/geelen/react-snapshot/pull/58)
- Added `build-dir`, `output-dir`, and `domain` CLI options [#84](https://github.com/geelen/react-snapshot/pull/84)

## [1.1.0] - 2017-05-24

### Added

- Read paths from `package.json` if present [#12](https://github.com/geelen/react-snapshot/pull/12). Uses `include` and `exclude` fields to filter by.
- Understand `homepage` field in `package.json` [#21](https://github.com/geelen/react-snapshot/pull/21).
- Understands `proxy` field, at least for simple cases [#26](https://github.com/geelen/react-snapshot/pull/26)

### Changed

- Don't follow `target="_blank"` links.
- Don't follow links to any URL with a file extension (except `.html`).
- If a URL is `/a/b` it'll render into `a/b.html` as before, but if it's `a/b/` it'll output `a/b/index.html`.
- No longer uses a hardcoded port [#27](https://github.com/geelen/react-snapshot/pull/27).

### Fixed

- Don't crash on null links [#20](https://github.com/geelen/react-snapshot/pull/20)
- React Helmet v5 now works [#27](https://github.com/geelen/react-snapshot/pull/27)

## [1.0.4] - 2016-09-27

Initial release.
