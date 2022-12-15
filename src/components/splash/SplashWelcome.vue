
<template lang='pug'>

app-content.page(class='pa-3 text-center')

    app-brand.brand(class='large py-5')

    h2(class='my-5') Read the whole Bible
    h3(class='mb-5') At your own pace

    v-list(class='text-left')
        v-list-item
            v-list-item-avatar
                app-svg(name='icon_done')
            v-list-item-content
                v-list-item-title Tick off chapters as you go
        v-list-item
            v-list-item-avatar
                app-svg(name='icon_view_list')
            v-list-item-content
                v-list-item-title Choose what you read next
        v-list-item
            v-list-item-avatar
                app-svg(name='icon_local_library')
            v-list-item-content
                v-list-item-title Read in app or use own Bible
        v-list-item
            v-list-item-avatar
                app-svg(name='icon_attach_money')
            v-list-item-content
                v-list-item-title Completely free and private

    v-alert(v-if='prerelease === "test"' color='error' class='body-2 text-left')
        template(#prepend)
            app-svg(name='icon_warning' class='mr-3')
        | This version is for testing new features only and you may lose your data.
        | Use the <a href='https://track.bible'>main app</a> for your real data.
    v-alert(v-else-if='prerelease === "beta"' color='accent' class='body-2 text-left')
        template(#prepend)
            app-svg(name='icon_info' class='mr-3')
        | This is a beta version. It's ready to use but may still have some issues.
        | If you identify any, please let us know.

    p(class='mt-3')
        v-btn(@click='done' outlined) Let's Go!

</template>


<script lang='ts'>


import {Component, Vue} from 'vue-property-decorator'

import {prerelease} from '@/services/misc'
import AppBrand from '@/components/reuseable/AppBrand.vue'


@Component({components: {AppBrand}})
export default class extends Vue {
    prerelease = prerelease

    done(){
        this.$store.commit('set_dict', ['show_splash_welcome', false])
    }
}


</script>


<style lang='sass' scoped>

.page
    background-color: $primary
    color: $on_primary

.brand
    justify-content: center

h2
    font-size: 30px
    font-weight: 500

h3
    font-size: 22px
    font-weight: 400

.v-list
    display: inline-block // So can center whole list

    .v-list-item__avatar
        // Override default avatar size (applied as inline style)
        width: 32px !important
        height: 32px !important

    .v-list-item__title
        white-space: normal  // Allow wrapping

.v-alert svg
    min-width: 24px


</style>
