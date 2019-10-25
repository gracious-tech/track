
<template lang='pug'>

div
    v-toolbar(color='primary' dark)
        v-btn(icon to='../')
            app-svg(name='icon_arrow_back')
        v-toolbar-title Install

    app-content(class='pa-5')
        div(class='d-flex flex-column align-center')
            h2(class='title mb-7 text-center') There's a new way to install apps now...
            h2(class='headline mb-7 text-center app-fg-accent-relative') Add to Home Screen!
            ul(class='mb-5')
                li No download needed
                li No permissions needed
                li Works offline

        hr

        h2(class='title mt-8 mb-5 app-fg-accent-relative') How to install

        v-select(v-model='env' :items='env_items' outlined label="Your browser/device")

        p(v-t='`install.${env}.howto`')
        img(v-if='env_has_image' :src='`/_assets/optional/install/${env}.png`')
        p(v-t='`install.${env}.howto_minor`' class='text--secondary body-2')

</template>


<script lang='ts'>

import {Component, Vue} from 'vue-property-decorator'

import {install_env, install_env_order} from '@/services/utils'
import {i18n_strings} from '@/services/i18n'


@Component({})
export default class extends Vue {

    env = install_env

    get env_items(){
        // Get items for select field
        return install_env_order.map(env_code => {
            return {value: env_code, text: this.$t(`install.${env_code}.name`)}
        })
    }

    get env_has_image(){
        // Return whether install image present for selected env
        return !['desktop', 'android_other'].includes(this.env)
    }

    beforeRouteEnter(to, from, next){
        // If an install prompt event is available, use it and cancel navigation
        // This allows any link to install page to act as an install button instead
        if (self._beforeinstallprompt){
            (self._beforeinstallprompt as any).prompt()
            self._beforeinstallprompt = undefined  // Only allowed to call prompt() once
            next(false)
        } else {
            next()
        }
    }
}

</script>


<style lang='sass' scoped>


img
    width: 100%
    max-width: 400px
    margin-bottom: 16px


</style>
