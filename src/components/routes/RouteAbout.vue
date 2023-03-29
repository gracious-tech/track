
<template lang='pug'>

div
    v-toolbar(color='primary' dark)
        v-btn(icon to='../')
            app-svg(name='icon_arrow_back')
        v-toolbar-title About

    app-content(class='pa-5')
        p This app is a free gift from <a href='https://gracious.tech' target='_blank'>Gracious Tech</a>.
        p
            a(href='https://copy.church/licenses/free-equiv/' target='_blank')
                img(src='https://copy.church/badges/brand/lcc/free-equiv.svg' alt="Let's copy, church. Public domain equivalent.")
        p We create apps that are:
        ul(class='mb-3')
            li Mission-focused
            li High quality
            li Secure
            li Free
        p As such, this app is completely non-profit with no ads, no tracking, and nothing else that would benefit us. This app is for your benefit alone. Your data is stored in your device and never leaves it. You can see this for yourself as <a href='https://github.com/gracious-tech/track' target='_blank'>the code is open source</a>.
        p(class='body-2 text--secondary') Our servers do store data your device sends to us by default (such as your IP address and browser version). Error reports are also sent to us in the rare event the app fails, but they do not contain any of your data. All received data is used for quality improvement, never for commercial reasons.
        p We hope this app helps you read all of God's word and to have faith in him.

        p(class='body-2 text--secondary text-center mt-12') Version {{ version }}
        p(class='body-2 text--secondary text-center') {{ sw_status }}

</template>


<script lang='ts'>

import {Component, Vue} from 'vue-property-decorator'

import {version} from '@/services/misc'


@Component({})
export default class extends Vue {

    version = version
    sw_status = "Offline viewing not supported in this browser"

    created(){
        // Check status of SW if supported
        // WARN Currently doesn't listen for changes so must leave/enter to refresh status
        if (self.navigator.serviceWorker){
            // Don't block execution for this
            this.determine_sw_status().then(status => {
                this.sw_status = status
            })
        }
    }

    async determine_sw_status(){

        // Get the SW registration (should only be one), and undefined if haven't registered yet
        const rego = await self.navigator.serviceWorker.getRegistration()
        if (!rego){
            return "Offline viewing not yet initialized"
        }

        // Collect a string of codes for debugging SW
        const codes = []

        // See if page controlled yet
        if (self.navigator.serviceWorker.controller){
            codes.push("controlling")
        }

        // Get info from registration
        for (const key of ['active', 'waiting', 'installing']){
            if (rego[key]){
                codes.push(key)
            }
        }

        return `Offline viewing supported (${codes.join(', ')})`
    }

}

</script>


<style lang='sass' scoped>


</style>
