
<template lang='pug'>

app-content.page(class='pa-5 text-center')
    h1(v-t='`install.${env}.splash_title`' class='headline mt-10')
    h2(v-t='`install.${env}.splash_subtitle`' class='title mt-5')
    p(v-t='`install.${env}.howto`' class='mt-5')
    p
        img(:src='`/_assets/optional/install/${env}.png`' class='mt-8')
    p(v-t='`install.${env}.howto_minor`' class='text--secondary')

    v-btn(@click='show_dialog = true' text class='mt-5') Preview app first
    v-dialog(persistent v-model='show_dialog')
        v-card(class='pa-3')
            v-card-title(class='headline') Data will not be saved
            v-card-text
                p(class='body-1') You can preview this app without installing it, but any data you enter will not be preserved when you do install. You'll have to start again. Would you still like to preview the app?
            v-card-actions
                v-btn(@click='show_dialog = false' text) Cancel
                v-btn(@click='dismiss_splash' text color='error') Preview app

</template>


<script lang='ts'>

// WARN Keep this app decoupled and reusable in other projects

import {Component, Vue} from 'vue-property-decorator'

import {install_env} from '@/services/utils'


@Component({})
export default class extends Vue {

    show_dialog = false
    env = install_env

    dismiss_splash(){
        this.$store.commit('set_dict', ['show_splash_install_averse', false])
    }
}

</script>


<style lang='sass' scoped>

.page
    background-color: $primary
    color: $on_primary

img
    width: 100%
    max-width: 400px
    display: inline-block

</style>
