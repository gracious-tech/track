
import VueRouter from 'vue-router'

import RouteRoot from '@/components/routes/RouteRoot/RouteRoot.vue'
import RouteAbout from '@/components/routes/RouteAbout.vue'
import RouteSettings from '@/components/routes/RouteSettings.vue'
import RouteBook from '@/components/routes/RouteBook.vue'
import RouteVideo from '@/components/routes/RouteVideo.vue'
import RouteChapter from '@/components/routes/RouteChapter.vue'
import RouteInstall from '@/components/routes/RouteInstall.vue'
import RouteInvalid from '@/components/routes/RouteInvalid.vue'
import {call_next} from '@/services/utils'


// Route config
const routes = [
    {path: '/', component: RouteRoot},
    {path: '/about/', component: RouteAbout},
    {path: '/install/', component: RouteInstall},
    {path: '/settings/', component: RouteSettings},
    {path: '/bible/', redirect: '/'},
    {path: '/bible/:book/', component: RouteBook},
    {path: '/bible/:book/video/', component: RouteVideo},
    {path: '/bible/:book/:chapter/', component: RouteChapter, name: 'chapter', props: route => {
        return {
            book: route.params.book,
            chapter: Number(route.params.chapter),
        }
    }},
    {path: '*', component: RouteInvalid},
]


// Make all routes strict (don't remove trailing slashes) and case-sensitive
// TODO Refactor after implemented https://github.com/vuejs/vue-router/issues/2404
for (const route of routes){
    (route as any).pathToRegexpOptions = {strict: true, sensitive: true}
}


// Helper to init router once store is ready (as some navigation guards depend on it)
export function get_router(store){

    // Init router
    const router = new VueRouter({mode: 'history', routes})

    // Redirect to last URL visited when launching app
    // WARN Initial load !== launch (as could refresh page), rather launch is opening when installed
    //      So only redirect if installed so desktop etc can still link directly to / if desired
    // WARN Always redirect for iOS as it will open whatever URL it was first installed under
    // NOTE router.currentRoute doesn't have search params on initial load for some reason...
    if (self._installed){
        router.replace(store.state.last_url)
    }

    // NOTE Navigation guards are applied in order they are created

    // Redirect all non-trailing-slash URLs to trailing-slash version so that ../ etc work correctly
    router.beforeEach(call_next((to, from) => {
        if (! to.path.endsWith('/')){
            if (process.env.NODE_ENV === 'development'){
                // Redirection only for production (in case user modifies the URL themselves)
                throw new Error(`Target URL does not end with a slash: ${to.path}`)
            }
            const new_to = {...to}
            new_to.path += '/'
            return new_to
        }
    }))

    // Record latest URL to return to upon reopening app, and prev route for scroll position feature
    router.afterEach((to, from) => {
        store.commit('set_tmp', ['prev_route', from])
        store.commit('set_dict', ['last_url', to.path])
    })

    return router
}
