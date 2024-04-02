# 2FAuth Browser Extension

A Firefox/Chrome extension built in [Angular](https://angular.io/) for the awesome self-hosted [2FAuth](https://github.com/Bubka/2FAuth) project by [Bubka](https://github.com/Bubka).

## Usage

1. Generate a Personal Access Token for your account on your 2FAuth instance.
2. Set the Host URL in the extension to point to your 2FAuth instance.
3. Enter the token generated in step 1. into the Personal Access Token field in the extension settings.
4. Save your settings.

The extension will load your preferences from the 2FAuth instance and use them to guide its appearance/behaviour.

The settings currently used include:
- Show Icons
- Password formatting
- Copy OTP on display
- Close OTP after copy

## Simple Installation

### Firefox
#### Option 1:
View the extension in the [Mozilla Add-On store](https://addons.mozilla.org/en-US/firefox/addon/2fauth/) and click the "Add to Firefox" button.
#### Option 2:
Download the Firefox xpi for the latest release from [here](https://github.com/josh-gaby/2fauth-browser-extension/releases) and open in Firefox.

### Chrome
#### Option 1:
View the extension in the [Chrome Extension store](https://chromewebstore.google.com/detail/2fauth/oplibojgambbikkdocijojhbdgdgealg) and click the "Add to Chrome" button.
#### Option 2:
Download the Chrome crx for the latest release from [here](https://github.com/josh-gaby/2fauth-browser-extension/releases), open `chrome://extensions` and drag the downloaded file onto the page.

## Development Installation

### Firefox
1. Download the latest [Firefox release](https://github.com/josh-gaby/2fauth-browser-extension/releases) or build using the instructions below.
2. Disable the Firefox extension signing requirement.

   Firefox [Extended Support Release (ESR)](https://www.mozilla.org/firefox/organizations/), Firefox [Developer Edition](https://www.mozilla.org/firefox/developer/) and [Nightly](https://nightly.mozilla.org/) versions of Firefox will allow you to override this setting by changing the preference `xpinstall.signatures.required` to `false` in the `about:config` page.
3. Install the extension by going to `about:addons` and dragging the downloaded zip file onto the page.


### Chrome
1. Download and extract the latest [Chrome release](https://github.com/josh-gaby/2fauth-browser-extension/releases) or build using the instructions below.
2. Enable Developer Mode in Chrome.

   You can do this using the Developer Mode toggle in `chrome://extensions`.
3. Click the `Load Unpacked` button and select the folder you extracted the extension to.


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
