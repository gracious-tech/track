
<template lang='pug'>

div
    v-toolbar(color='primary' dark)
        v-btn(icon to='../')
            app-svg(name='icon_arrow_back')
        v-toolbar-title {{ $t('title_prefix') }} {{ book_name }} {{ chapters }}

    iframe(:src='src' allowfullscreen
        allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture')

</template>


<i18n>
en:
    title_prefix: Overview of
</i18n>


<script lang='ts'>

import {Component, Vue} from 'vue-property-decorator'

import data from '@/data/data.json'


@Component({})
export default class extends Vue {

    get book(){
        return this.$route.params.book
    }

    get video_data(){
        // Get the id and chapter range for the requested video
        const all_videos = this.$store.getters.book_videos_for(this.book)
        let i = Number(this.$route.query.i) || 0
        // WARN Chance i=1 but changed locale which has only one video, so must check value
        i = Math.min(i, all_videos.length - 1)
        return all_videos[i]
    }

    get src(){
        const video_id = this.video_data[0]
        const params = 'iv_load_policy=3&modestbranding=1&rel=0'
        return `https://www.youtube-nocookie.com/embed/${video_id}?${params}`
    }

    get book_name(){
        return this.$store.state.tmp.book_names[this.book]
    }

    get chapters(){
        const chs = this.video_data[1]
        return chs ? `(${chs})` : ''
    }
}

</script>


<style lang='sass' scoped>

iframe
    margin: 0 auto
    max-width: $content-width
    width: 100%
    height: 100%
    border-style: none

</style>
