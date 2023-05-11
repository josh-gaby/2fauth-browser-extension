# 2FAuth Browser Extension

A Firefox/Chrome extension built in [Angular](https://angular.io/) for the awesome self-hosted [2FAuth](https://github.com/Bubka/2FAuth) project by [Bubka](https://github.com/Bubka).

## ** important usage details for the password grant branch **
Eventually this branch will be merged into master but until the 2FAuth interface allows creating your own client ID / secret instead of a Personal Access Token you will need to do that manually.

The steps are easy so if you want to try it out, you just need to do the following:
1. Checkout the `password-grant-workflow` branch.
2. Build the version you want using either `npm run build:chrome` or `npm run build:firefox` and install it in your browser following the instructions further down the page. 
3. Change to your 2FAuth instance.
1. Run `php artisan passport:client --password` from the root folder of your 2FAuth install.
2. Enter a name for your client.
3. Select `[0] users` to allow your users to login using the client.
4. Copy the generated ID and secret into the Client ID and Client Secret fields in the extension.
5. Enter your host URL, username, and password into the extension and click save.

   I will be replacing the password field on the settings page with a popup password prompt in the future, the password entered in step 5 will not be saved, it is just being used to connect to 2FAuth to confirm the entered information is valid and to get an initial access token.


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


## Installing from this repository

### Firefox
1. Download the latest [Firefox release](https://github.com/josh-gaby/2fauth-browser-extension/releases)
2. Disable the Firefox extension signing requirement.

   Firefox [Extended Support Release (ESR)](https://www.mozilla.org/firefox/organizations/), Firefox [Developer Edition](https://www.mozilla.org/firefox/developer/) and [Nightly](https://nightly.mozilla.org/) versions of Firefox will allow you to override this setting by changing the preference `xpinstall.signatures.required` to `false` in the `about:config` page.
3. Install the extension by going to `about:addons` and dragging the downloaded zip file onto the page.


### Chrome
1. Download and extract the latest [Chrome release](https://github.com/josh-gaby/2fauth-browser-extension/releases)
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
