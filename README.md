# 2FAuth-Browser-Extension

A Firefox/Chrome extension for the [2FAuth](https://github.com/Bubka/2FAuth) project.

## Development 

### Requirements

- [NodeJS](https://nodejs.com) v18
- [NPM](https://npmjs.com) v8 (included with Node)

### Commands
#### Dev builds
```shell
# Build all dev versions
npm run build

# Build Chrome dev version
npm run build:chrome

# Build Firefox dev version
npm run build:firefox
```

#### Distribution builds
```shell
# Build all distribution versions
npm run dist

# Build Chrome distribution version
npm run dist:chrome

# Build Firefox distribution version
npm run dist:firefox
```

### Installing from this repository

#### Firefox
1. Download the latest [Firefox release](https://github.com/josh-gaby/2fauth-browser-extension/releases/download/pre-release/2fauth-firefox-2023.5.0-alpha.zip)
2. Disable the Firefox extension signing requirement. 

   Firefox [Extended Support Release (ESR)](https://www.mozilla.org/firefox/organizations/), Firefox [Developer Edition](https://www.mozilla.org/firefox/developer/) and [Nightly](https://nightly.mozilla.org/) versions of Firefox will allow you to override this setting by changing the preference `xpinstall.signatures.required` to `false` in the `about:config` page.
3. Install the extension be going to `about:addons` and dragging the downloaded zip file onto the page.


#### Chrome
1. Download and extract the latest [Chrome release](https://github.com/josh-gaby/2fauth-browser-extension/releases/download/pre-release/2fauth-chrome-2023.5.0-alpha.zip)
2. Enable Developer Mode in Chrome. 

   You can do this using the Developer Mode toggle in `chrome://extensions`.
3. Click the `Load Unpacked` button and select the folder you extracted the extension to.
