
<template lang='pug'>

v-dialog(v-model='dialog')
    v-card(class='pa-3')

        v-card-title(class='headline') Share progress

        v-card-text(class='text-center')

            template(v-if='url')
                img(:src='url + ".jpg"' style='width:100%')
                v-switch(v-model='share_last_read' @change='request_image'
                    label="Include books recently read")
                v-textarea(v-if='cant_share' ref='copy_field' :value='url' readonly auto-grow
                    rows='1' :error-messages='copy_field_error')

            template(v-else-if='error')
                p(class='app-fg-error-relative body-1') {{ error }}
                v-btn(@click='request_image' text) Retry

            template(v-else)
                p(class='body-2 text--secondary') Generating your progress image (won't take long)
                v-progress-circular(indeterminate color='accent')

        v-card-actions(class='justify-center')
            v-btn(@click='dialog = false' text) CLOSE
            v-btn(@click='share' :disabled='!url || cant_copy' text color='accent')
                | {{ cant_share ? "Copy link" : "Share" }}

    //- Google recommends minimum of 4 seconds display
    v-snackbar(v-model='copied_snackbar' :timeout='4000') Link copied

</template>


<i18n>
</i18n>


<script lang='ts'>

import {Component, Vue} from 'vue-property-decorator'

import {prerelease} from '@/services/misc'
import {sorted_json, urlsafe_hash} from '@/services/utils'


@Component({})
export default class extends Vue {

    url = null
    error = null
    last_request = null
    dialog = false
    copied_snackbar = false
    cant_share = !self.navigator.share
    cant_copy = false  // Won't know until try

    get share_last_read(){
        return this.$store.state.share_last_read
    }

    set share_last_read(value){
        this.$store.commit('set_dict', ['share_last_read', value])
    }

    get copy_field_error(){
        return this.cant_copy ? "Browser can't copy, please copy this link yourself" : ""
    }

    get request_data(){
        // Get request data for shareable image
        // NOTE Vue should ensure that this value only changes if state it relies on changes
        //      .'. it should in that sense be idempotent
        const share_data = this.$store.getters.share_data

        // Convert bools array to string of 1|0 (to reduce request size)
        share_data.chapters = share_data.chapters.map(b => b ? 1 : 0).join('')

        // Return as a utf8 array buffer of sorted json
        return new TextEncoder().encode(sorted_json(share_data))
    }

    hash_to_url(hash){
        // Return url for page of progress from given hash
        const next = prerelease === 'test' ? 'next-' : ''
        return `https://${next}track-bible-share.s3.amazonaws.com/${hash}`
    }

    async request_image(){
        // Request a shareable image

        // Reset state
        this.last_request = this.request_data
        this.url = null
        this.error = null

        // Use existing image if already generated
        const existing_url = this.hash_to_url(await urlsafe_hash(this.last_request))
        try {
            const existing_resp = await fetch(existing_url, {method: 'HEAD'})
            if (existing_resp.ok){
                this.url = existing_url
                return
            }
        } catch(exc) {
            // Almost certainly a network error if no response returned
            this.error = "Couldn't connect to network"
            return
        }

        // Submit request
        fetch('/_gen_shareable_image', {
            method: 'POST',
            body: this.last_request,
            headers: {'Content-Type': 'application/json;charset=UTF-8'},
        }).then(async resp => {

            // Get url from hash if all good
            if (resp.ok){
                this.url = this.hash_to_url((await resp.json()).hash)
                return
            }

            // Handle bad responses
            this.error = "Something went wrong :("
            const text = await resp.text()
            self._fail_log(`${resp.status} ${resp.statusText}\n\n${text}`)

        }).catch(() => {
            // Almost certainly a network error if no response returned
            this.error = "Couldn't connect to network"
        })
    }

    open_dialog(){
        // Make new request if data has changed or image not generated yet
        if (!this.url || this.last_request !== this.request_data){
            this.request_image()
        }
        this.dialog = true
    }

    share(){
        // Launch native share widget, or copy link if not available
        if (this.cant_share){
            // Select the text that is to be copied
            // NOTE actual input with actual text is nested within the vue component
            (this.$refs.copy_field as any).$el.querySelector('textarea').select()
            // Try to copy and disable button (also shows message) if didn't work
            if (self.document.execCommand('copy')){
                this.copied_snackbar = true
            } else {
                this.cant_copy = true
            }
        } else {
            self.navigator.share({url: this.url})
        }
    }

}
</script>


<style lang='sass' scoped>


</style>
