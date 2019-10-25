
<template lang='pug'>

div(v-if='show' class='install-banner app-bg-accent d-flex pa-2')
    //- Dud button so install button is equally spaced in center
    v-btn(icon disabled)
    v-btn(@click='install' text class='flex-grow-1') Install app
    v-btn(@click='dismiss' icon)
        app-svg(name='icon_close')

</template>


<script lang='ts'>

import {Component, Vue} from 'vue-property-decorator'

import {install_env} from '@/services/utils'


@Component({})
export default class extends Vue {

    get show(){
        // Whether should show install banner
        // Don't show if already installed or banner dismissed
        // NOTE Can't necessarily install from current browser (e.g. iOS Chrome)
        //      But at least points to install page that explains how to install via other browser
        return this.$store.state.show_install_banner && !self._installed
    }

    install(){
        this.$router.push('install/')
        // Dismiss banner if on desktop (currently no way to detect if installed or not)
        if (install_env === 'desktop'){
            this.$store.commit('set_dict', ['show_install_banner', false])
        }
    }

    dismiss(){
        this.$store.commit('set_dict', ['show_install_banner', false])
    }
}

</script>


<style lang='sass' scoped>


.install-banner
    min-height: 52px  // ios 10.3 and Samsung Internet need this


</style>
