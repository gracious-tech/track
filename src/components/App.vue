
<template lang='pug'>

v-app(:class='app_classes')
    //- v-app will become .v-application > .v-application--wrap > ...
    //- Dialogs etc will be children of .v-application
    //- Transition will not appear in the DOM itself
    transition(:name='transition')
        component(:is='docked' class='docked')

    //- Unlike beta, this banner should appear on every page
    div(v-if='test_release' class='release-banner test') TEST

</template>


<script lang='ts'>

import {Component, Vue, Watch} from 'vue-property-decorator'

import {prerelease} from '@/services/misc'
import {install_env} from '@/services/utils'
import SplashWelcome from '@/components/splash/SplashWelcome.vue'
import SplashWelcomeInit from '@/components/splash/SplashWelcomeInit.vue'
import SplashInstallAverse from '@/components/splash/SplashInstallAverse.vue'
import SplashComplete from '@/components/splash/SplashComplete.vue'
import SplashCompleteReset from '@/components/splash/SplashCompleteReset.vue'


@Component({
    components: {SplashWelcome, SplashWelcomeInit, SplashInstallAverse, SplashComplete,
        SplashCompleteReset},
})
export default class extends Vue {

    route_transition = 'jump'
    test_release = prerelease === 'test'

    get docked(){
        // Show first item that wants to be shown
        const items = [
            ['splash-welcome', this.$store.state.show_splash_welcome],
            ['splash-install-averse', this.$store.state.show_splash_install_averse],
            ['splash-welcome-init', this.$store.state.show_splash_welcome_init],
            ['splash-complete', this.$store.getters.profile_complete
                && !this.$store.getters.profile.completed_puzzle_dismissed],
            ['splash-complete-reset', this.$store.getters.profile_complete],
            ['router-view', true],
        ]
        return items.find(([component, show]) => show)[0]
    }

    get transition(){
        // Always jump if transitioning with splashes
        return this.docked === 'router-view' ? this.route_transition : 'jump'
    }

    get app_classes(){
        // Return classes for the component's root
        const classes = []
        if (install_env === 'desktop'){
            classes.push('custom-scroll')
        }
        if (this.$store.state.dark){
            classes.push('dark')
        }
        return classes
    }

    @Watch('$route') watch_$route(to, from){
        if (to.path.startsWith(from.path)){
            this.route_transition = 'deeper'
        } else if (from.path.startsWith(to.path)){
            this.route_transition = 'shallower'
        } else {
            this.route_transition = 'jump'
        }
    }
}
</script>


<style lang='sass' scoped>


// Keyframes for router transition animations

@keyframes slide-left-enter
    from
        transform: translateX(100%)
    to
        transform: translateX(0)

@keyframes slide-left-leave
    from
        transform: translateX(0)
    to
        transform: translateX(-100%)

@keyframes slide-right-enter
    from
        transform: translateX(-100%)
    to
        transform: translateX(0)

@keyframes slide-right-leave
    from
        transform: translateX(0)
    to
        transform: translateX(100%)

@keyframes slide-up-enter
    from
        transform: translateY(100%)
    to
        transform: translateY(0)

@keyframes slide-up-leave
    from
        transform: translateY(0)
    to
        transform: translateY(-100%)


// Route layout and transitions

.docked
    display: flex
    flex-direction: column
    flex-grow: 1
    // Defaults for all transition animations
    animation-duration: 375ms
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1)

    &.deeper-enter-active
        animation-name: slide-left-enter

    &.deeper-leave-active
        animation-name: slide-left-leave

    &.shallower-enter-active
        animation-name: slide-right-enter

    &.shallower-leave-active
        animation-name: slide-right-leave

    &.jump-enter-active
        animation-name: slide-up-enter

    &.jump-leave-active
        animation-name: slide-up-leave

    // Need to absolute position a route when it's leaving so entering route not displaced
    &.deeper-leave-active, &.shallower-leave-active, &.jump-leave-active
        position: absolute
        width: 100%


// Custom scrollbar


.custom-scroll
    // Make scrollbars more subtle and themed
    // WARN Only apply to desktop, as mobile scrollbars should be hidden (and default to so)
    scrollbar-width: 12px
    scrollbar-color: #0002 transparent  // WARN ::-webkit-scrollbar-thumb must also be changed

    ::-webkit-scrollbar
        width: 12px
        background-color: transparent

    ::-webkit-scrollbar-thumb
        background-color: #0002

    &.dark
        scrollbar-color: #fff2 transparent

        ::-webkit-scrollbar-thumb
            background-color: #fff2


</style>
