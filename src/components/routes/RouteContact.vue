
<template lang='pug'>

div
    v-toolbar(color='primary' dark)
        v-btn(icon to='../')
            app-svg(name='icon_arrow_back')
        v-toolbar-title Contact

    app-content(class='pa-5')
        v-textarea(v-model='message' required label="Your message")
        v-text-field(v-model='email' label="Your email address (if you'd like a reply)")
        v-file-input(label="Optional screenshot of the issue")
        v-btn(@click='send') Send

</template>


<script lang='ts'>

// TODO Work in progress

import {Component, Vue} from 'vue-property-decorator'

import {generate_uuid} from '@/services/utils'


@Component({})
export default class extends Vue {

    message
    email

    send(){
        /* Generate uuid
        const uuid = generate_uuid()
        send_file(uuid, message)
        if (image){
            send_file(uuid, image)
        }*/
    }

    send_file(uuid, file){

        // Form data
        const form_data = new FormData()
        form_data.append('key', uuid)
        form_data.append('file', file)
        form_data.append('signature', 'bW2RUVJar1qwUL01F0NYo/0R+ko=')
        form_data.append('AWSAccessKeyId', 'AKIATALBNBBRA2RCCR32')
        form_data.append('policy', 'eyJleHBpcmF0aW9uIjogIjIxMTktMDgtMjhUMTI6MTE6NDVaIiwgImNvbmRpdGlvbnMiOiBbWyJjb250ZW50LWxlbmd0aC1yYW5nZSIsIDEsIDUwMDAwMDBdLCB7ImJ1Y2tldCI6ICJjb250YWN0LWdyYWNpb3VzLXRlY2gifSwgWyJzdGFydHMtd2l0aCIsICIka2V5IiwgIiJdXX0=')  // tslint:disable-line:max-line-length

        // Send request
        const url = 'https://contact-gracious-tech.s3.amazonaws.com/'
        fetch(url, {method: 'POST', body: form_data})
    }
}

</script>


<style lang='sass' scoped>


</style>
