
// Third-party
import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import VueI18n from 'vue-i18n'
import Vuetify from 'vuetify/lib'  // WARN Must import from /lib for tree shaking
import VuetifyRoutable from 'vuetify/lib/mixins/routable'

// Own modules
import '@/services/register_hooks'  // WARN Must come before any components imported
import app_config from '@/app_config.json'
import {get_store} from '@/services/store'
import {get_router} from '@/services/router'
import {i18n_strings} from '@/services/i18n'

// Components
import App from '@/components/App.vue'
import AppSVG from '@/components/global/AppSVG.vue'
import AppContent from '@/components/global/AppContent.vue'


// Stop app scrolling beyond actual height on iOS
import 'inobounce'


// Trigger addition of generic styles (webpack config will still put in separate css file)
import '@/services/generic_styles.sass'


// Interact with fetch(bible)
import '@/services/fetch'


// Make beforeinstallprompt event available to custom handler
self.addEventListener('beforeinstallprompt', event => {
    // Prevent showing prompt right now
    event.preventDefault()  // NOTE Chrome 76+ only
    // Save event instance for use later
    self._beforeinstallprompt = event
})


// Determine if app installed
// WARN Must run before router init'd as it will change location before can check query
self._installed = (() => {
    // navigator.standalone is an ios-only property (and ios 10.3+ don't support Manifest)
    // `display-mode: standalone` only supported in Firefox 57+ and not yet in Samsung Internet 10
    // Manifest is given a unique url, but sometimes app is reloaded from last session / last url
    // .'. Use a combination of all three
    const from_manifest = self.location.pathname === '/' && self.location.search === '?manifest'
    const media_standalone = self.matchMedia('display-mode: standalone').matches
    return self.navigator.standalone || from_manifest || media_standalone
})()


// Request persistant storage if installed
// NOTE Chrome (after installed) will auto-grant, but Firefox shows popup to user
if (self._installed && self.navigator.storage && self.navigator.storage.persist){
    self.navigator.storage.persisted().then(enabled => {
        if (!enabled){
            self.navigator.storage.persist()
        }
    })
}


// Register service worker
// NOTE Disabled during dev so refreshes easily even without dev tools open (enable when desired)
// NOTE No SW support in iOS 10-11.2
if (process.env.NODE_ENV !== 'development' && 'serviceWorker' in self.navigator){
    // Do after everything else downloaded so doesn't interfere with inital load
    // NOTE Workbox _doesn't_ cache on the fly for most of app, so early registration pointless
    //      And won't necessarily do duplicate downloads if regular browser cache helps out
    self.addEventListener('load', () => {
        // If fails will be a promise rejection that will be logged
        // NOTE Firefox fails with "SecurityError: The operation is insecure" if cookies restricted
        //      https://stackoverflow.com/questions/49539306/
        self.navigator.serviceWorker.register('/sw.js')
    })
}


// Vue config
Vue.config.productionTip = false  // Don't show warning about running in development mode
Vue.config.errorHandler = (error, vm, info) => self._fail(self._error_to_msg(error) + '\n' + info)
Vue.config.warnHandler = (msg, vm, trace) => self._fail(msg + '\n' + trace)  // Only works in dev


// Default all Vuetify router links to exact matching for active class
//      Otherwise all nav buttons to shallower routes look selected (e.g. back arrows)
VuetifyRoutable.extendOptions.props.exact.default = true


// Plugins
Vue.use(Vuex)
Vue.use(VueRouter)
Vue.use(VueI18n)
Vue.use(Vuetify)


// Register global components
Vue.component('app-svg', AppSVG)
Vue.component('app-content', AppContent)


// i18n
const i18n = new VueI18n({
    messages: i18n_strings,
    locale: 'en',
    fallbackLocale: 'en',
    // NOTE preserveDirectiveContent required to stop text disappearing before route animation ends
    preserveDirectiveContent: true,
    // Consider missing an i18n string (entirely) a hard fail
    missing: (locale, path, vm) => self._fail(`Missing i18n path: ${path}`),
})


// Vuetify
const vuetify_theme = {
    primary: app_config.theme.primary,
    accent: app_config.theme.accent,
    error: app_config.theme.error,
    anchor: app_config.theme.accent,
}
// NOTE Colors same for both dark/light to keep branding consistent (and simpler sass!)
const vuetify = new Vuetify({theme: {themes: {dark: vuetify_theme, light: vuetify_theme}}})


// Init app (once store is ready)
get_store().then(store => {

    // Give global access to store
    // NOTE Can't just rely on self._app as some methods (like router guards) called before ready
    self._store = store

    // Init Vuetify dark setting based on store value
    vuetify.framework.theme.dark = store.state.dark

    // Init router
    const router = get_router(store)

    // Mount app
    const render = h => h(App)
    self._app = new Vue({store, router, i18n, vuetify, render}).$mount('#app')

    // Log the opening of the app for usage statistics (since service worker will mask usage)
    // Also provides a count of opens while offline since last successful log
    const log_url = `/_log_open?offline_opens=${store.state.offline_opens}`
    const log_resp = fetch(log_url, {method: 'HEAD'})
    log_resp.then(() => {
        // Succeded, so reset offline opens count
        store.commit('set_dict', ['offline_opens', 0])
    })
    log_resp.catch(() => {
        // Offline, so increment count
        // NOTE Not chained off `then` so doesn't catch any issue with `store.commit`
        store.commit('set_dict', ['offline_opens', store.state.offline_opens + 1])
    })
})
