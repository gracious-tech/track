
import app_config from '@/app_config.json'
import {ios_device} from '@/services/utils'


// If not an iOS device the value will be null, so default to iPhone for other browsers to see
const ios_device_str = ios_device || 'iPhone'


export const i18n_strings = {
    // tslint:disable:max-line-length
    en: {install: {

        // Averse (installable, but data not persistant)
        // .'. Act like nothing wrong and prompt to install (as users expect anyway)
        ios_safari: {
            name: `${ios_device_str} (Safari)`,
            splash_title: "There's a new way to install apps now...",
            splash_subtitle: "You can install straight from Safari",
            howto: "Open the share menu, and click \"Add to Home Screen\"",
            howto_minor: "You may need to scroll up or sideways to see the button. You won't find this app in the App Store as it can already be installed from Safari instead.",
        },

        // Averse (not installable)
        // .'. Need to explain why can't install and tell to change browser
        ios_other: {
            name: `${ios_device_str} (other)`,
            splash_title: "Switch to Safari to install this app",
            splash_subtitle: `There's a new way to install apps, but on ${ios_device_str}s it's only available in Safari`,
            howto: `Open Safari and visit https://${app_config.domain}`,
            howto_minor: "You won't find this app in the App Store as it can already be installed from Safari instead. Apple doesn't allow any other browsers to install apps though, only Safari.",
        },
        ios_webview: {
            name: `${ios_device_str} (temporary window)`,
            splash_title: "App is open in a temporary window",
            splash_subtitle: "Switch to Safari to install it",
            howto: `This app cannot be installed from temporary windows. Instead, click the top-right menu and \"Open in Safari\".`,
            howto_minor: `Otherwise, you can just open Safari and visit https://${app_config.domain}. You won't find this app in the App Store as it can already be installed from Safari instead.`,
        },
        android_webview: {
            name: "Android (temporary window)",
            splash_title: "App is open in a temporary window",
            splash_subtitle: "Open in a browser so your data can be saved",
            howto: `This app cannot be installed from temporary windows. You can usually click \"Open with...\" in the top-right menu to open in a different browser such as Chrome.`,
            howto_minor: `Otherwise, you can open any browser and visit https://${app_config.domain}`,
        },

        // Non-averse
        // Either desktop or installs fine, so no splash
        android_chrome: {
            name: "Android (Chrome)",
            howto: "Click \"Add to Home screen\" in the top-right menu",
            howto_minor: "",
        },
        android_samsung: {
            name: "Android (Samsung Internet)",
            howto: "Click the install button in the top-right toolbar",
            howto_minor: "",
        },
        android_other: {
            name: "Android (other)",
            howto: "Click \"Add to Home screen\" in the browser menu",
            howto_minor: "If you don't see the option, try installing in Google Chrome.",
        },
        desktop: {
            name: "Other",
            howto: `Installing on computers is currently only supported in Chrome (click "install" in the address bar). To install on mobile devices, simply visit https://${app_config.domain} and follow the prompts.`,
            howto_minor: `On Android you can use browsers such as Chrome/Firefox/Samsung Internet. On iPhones, Apple only allows Safari to install apps. This app is not available in app stores as it can simply be installed from a browser instead.`,
        },
    },
    // tslint:enable:max-line-length
}}
