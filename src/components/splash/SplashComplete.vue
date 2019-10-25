
<template lang='pug'>

app-content.page(class='text-center')
    h1(class='display-3 mt-10') Congrats!
    h2(class='title mt-5')
        | Whole Bible
        app-svg(name='icon_done' class='ml-3 icon')

    img(@click='open_share_dialog' :src='`/_assets/optional/puzzles/${puzzle}.jpg`' class='mt-8')
    p(class='text-center mt-3')
        v-btn(@click='open_share_dialog' text dark)
            app-svg(name='icon_share' class='mr-3')
            | SHARE
    v-btn(@click='done' outlined class='mt-5' dark) Start fresh!

    app-share(ref='app_share')

</template>


<script lang='ts'>

import {Component, Vue} from 'vue-property-decorator'

import data from '@/data/data.json'
import AppShare from '@/components/reuseable/AppShare.vue'


@Component({components: {AppShare}})
export default class extends Vue {

    get puzzle(){
        return this.$store.getters.profile.puzzle
    }

    open_share_dialog(){
        (this.$refs.app_share as any).open_dialog()
    }

    done(){
        // Dismiss this splash if any extra progress, otherwise can conclude now
        for (const book of data.books){
            if (this.$store.getters.progress_book_for(book)[0]){
                this.$store.dispatch('set_profile', ['completed_puzzle_dismissed', true])
                return
            }
        }
        this.$store.dispatch('conclude_completion')
    }
}

</script>


<style lang='sass' scoped>

.page
    background-color: $primary
    color: $on_primary

img
    width: 100%
    cursor: pointer

.icon
    vertical-align: text-bottom

</style>
