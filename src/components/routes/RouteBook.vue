
<template lang='pug'>

div
    v-toolbar(color='primary' dark)
        v-btn(icon @click='go_to_root')
            app-svg(name='icon_arrow_back')
        v-toolbar-title
            | {{ book_name }}
            app-svg(v-if='book_read' name='icon_done' class='ml-2 tick tick-book')
        v-spacer
        span.progress(v-html='html_progress' class='mx-2')
        v-menu(bottom left transition='scale-transition' origin='80% 20px')
            template(#activator='{on}')
                v-btn(v-on='on' icon)
                    app-svg(name='icon_more_vert')
            v-list
                v-list-item(@click='bulk_complete_book')
                    v-list-item-title Mark whole book read
                v-list-item(@click='bulk_unread_book' :disabled='(! book_read) && (! some_chs_read)')
                    v-list-item-title Mark whole book unread
                v-list-item(@click='decrease_completions' :disabled='! completions')
                    v-list-item-title Decrease times book read

    app-content
        v-list
            v-list-item(v-for='video in videos' :key='video.to' :to='video.to' append)
                //- NOTE Official BP color used
                v-list-item-avatar(color='#05C3DE')
                    app-svg(name='logo_bible_project' class='v-avatar')
                v-list-item-content
                    v-list-item-title {{ $t('video_prefix') }} {{ video.chs_str }}
            v-list-item(v-for='chapter in chapters' :key='chapter.num' @click='chapter.toggle_read')
                v-list-item-avatar {{ chapter.num }}
                v-list-item-content
                    v-list-item-title(:class='{"accent--text": chapter.read}')
                        span {{ chapter.title }}
                        app-svg(v-if='chapter.read' :name='"icon_done" + (book_read ? "_all" : "")'
                            class='ml-2 tick')
                v-list-item-action
                    v-btn(:to='chapter.to' append icon)
                        app-svg(name='icon_subject')

</template>


<i18n>
en:
    video_prefix: Overview
    chapters: chapters
</i18n>


<script lang='ts'>

import {Component, Vue} from 'vue-property-decorator'

import data from '@/data/data.json'


@Component({})
export default class extends Vue {

    get book(){
        return this.$route.params.book
    }

    get book_name(){
        return this.$store.state.tmp.book_names[this.book]
    }

    get html_progress(){
        return this.$store.getters.progress_book_html_for(this.book)
    }

    get completions(){
        return this.$store.getters.completions_books_for(this.book)
    }

    get book_read(){
        // Whether book has been read in current read of whole Bible
        return this.$store.getters.done_books_for(this.book)
    }

    get some_chs_read(){
        // Whether any chapters have been read (whether current Bible read or additional read)
        return this.$store.getters.progress_book_for(this.book)[0] !== 0
    }

    get videos(){
        const videos = []
        this.$store.getters.book_videos_for(this.book).forEach(([id, chs], i) => {
            const query = i ? `?i=${i}` : ''
            videos.push({
                to: `video/${query}`,
                chs_str: chs ? `(${this.$t('chapters')} ${chs})` : '',
            })
        })
        return videos
    }

    get chapters(){
        const num_chapters = data.num_chapters[this.book]
        return Array.from({length: num_chapters}).map((trash, i) => {
            const num = i + 1
            const title = this.$store.state.tmp.chapter_titles[this.book][num]
            return {
                num,
                title,
                to: num + '/',
                read: this.$store.getters.done_chapters_for(this.book, num),
                toggle_read: () => this.$store.dispatch('toggle_ch_read', [this.book, num]),
            }
        })
    }

    mounted(){
        // Focus (and scroll to) chapter if just came from one
        const prev = this.$store.state.tmp.prev_route
        if (prev && prev.path.startsWith(`/bible/${this.book}/`) && 'chapter' in prev.params){
            // Focus on the read button rather than the whole chapter (since came from there)
            const read_btn = this.$el.querySelector(
                `[href="/bible/${this.book}/${prev.params.chapter}/"]`)
            if (read_btn){  // Element should always exist, but just in case...
                (read_btn as HTMLElement).focus()  // Auto-scrolls if not visible
            }
        }
    }

    go_to_root(){
        // Go to root page and ensure appropriate testament tab selected
        //     Further allows root component to focus the book just gone from
        const ot = data.books.indexOf(this.book) < data.books.indexOf('matt')
        this.$store.commit('set_tmp', ['root_selected_tab', ot ? 1 : 2])
        this.$router.push('/')
    }

    bulk_complete_book(){
        this.$store.dispatch('bulk_complete_book', this.book)
    }

    bulk_unread_book(){
        this.$store.dispatch('bulk_unread_book', this.book)
    }

    decrease_completions(){
        this.$store.dispatch('decrease_completions_for_book', this.book)
    }

}

</script>


<style lang='sass' scoped>


.tick-book
    // Keep small to distinguish from button icons, but fix alignment
    vertical-align: middle


::v-deep

    .progress
        font-size: 16px

    .v-list-item__avatar
        background-color: #ddd

    .theme--dark .v-list-item__avatar
        background-color: #666

    .v-list-item__title
        // Hide title first rather than the ticks, when not enough space
        display: flex
        > span:first-child
            overflow-x: hidden
            text-overflow: ellipsis

</style>
