
<template lang='pug'>

div

    v-toolbar(color='primary' dark)


        v-toolbar-title
            app-brand

        v-spacer

        v-menu(bottom left transition='scale-transition' origin='80% 20px')
            template(#activator='{on}')
                v-btn(v-on='on' icon)
                    app-svg(v-if='profiles.length === 1' name='icon_group')
                    span(v-else class='initials') {{ profile_initials }}

            v-list
                v-list-item(v-for='profile in profiles' :key='profile.id' @click='profile.activate')
                    v-list-item-title(:class='{"accent--text": profile.activated}') {{ profile.name }}
                //- Show link to settings when only one profile to educate user
                v-list-item(v-if='profiles.length === 1' to='/settings/')
                    v-list-item-title Edit profiles

        v-menu(bottom left transition='scale-transition' origin='80% 20px')
            template(#activator='{on}')
                v-btn(v-on='on' icon)
                    app-svg(name='icon_more_vert')

            v-list.main-menu
                v-list-item(to='settings/')
                    v-list-item-title
                        app-svg(name='icon_settings')
                        | Settings
                v-list-item(to='about/')
                    v-list-item-title
                        app-svg(name='icon_info')
                        | About
                v-list-item(to='install/')
                    v-list-item-title
                        app-svg(name='icon_get_app')
                        | Install

        template(#extension)
            v-tabs(v-model='selected_tab' color='text' background-color='transparent'
                    slider-color='accent' grow)
                v-tab Progress
                v-tab Old
                v-tab New

    app-content(class='pa-3')
        //- NOTE Swipe support disabled due to clash with inobounce (stops content scrolling)
        //- TODO Fix so can have swipe support
        //- Maybe due to this: https://github.com/vuetifyjs/vuetify/blob/e96d1fdb360dba468aa2f78d76224e266f5796f6/packages/vuetify/src/components/VSlideGroup/VSlideGroup.ts#L277
        v-tabs-items(v-model='selected_tab' touchless)
            v-tab-item
                route-root-progress
            v-tab-item
                route-root-testament(:ot='true')
            v-tab-item
                route-root-testament(:ot='false')

    app-install-banner

</template>


<i18n>
</i18n>


<script lang='ts'>

import {Component, Vue} from 'vue-property-decorator'

import AppBrand from '@/components/reuseable/AppBrand.vue'
import AppInstallBanner from '@/components/reuseable/AppInstallBanner.vue'
import RouteRootProgress from '@/components/routes/RouteRoot/RouteRootProgress.vue'
import RouteRootTestament from '@/components/routes/RouteRoot/RouteRootTestament.vue'


@Component({
    components: {RouteRootProgress, RouteRootTestament, AppBrand, AppInstallBanner},
})
export default class extends Vue {

    get selected_tab(){
        return this.$store.state.tmp.root_selected_tab
    }

    set selected_tab(index){
        this.$store.commit('set_tmp', ['root_selected_tab', index])
        // Scroll to top on every tab change, else next tab inherits scroll position of previous
        self.document.body.querySelector('.outer').scroll(0, 0)
    }

    get profiles(){
        return this.$store.getters.profiles_sorted.map(id => {
            return {
                id,
                name: this.$store.state.profiles[id].name,
                activated: this.$store.state.profile === id,
                activate: () => {this.$store.commit('set_dict', ['profile', id])},
            }
        })
    }

    get profile_initials(){
        return this.$store.getters.profile_initials
    }
}

</script>


<style lang='sass' scoped>


.initials
    font-size: 18px
    text-transform: none

.main-menu .v-list-item__title
    display: flex
    align-items: center

    svg
        margin-right: 12px


</style>
