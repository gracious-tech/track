
<template lang='pug'>

div
    app-content.notice(v-if='show_chapter_intro' class='pa-5')
        p(class='headline') Read here, another app, or your own Bible
        h2(class='headline app-fg-accent-relative my-5') Whatever you prefer!
        p(class='text--secondary body-2') Bible Gateway pages will be displayed. Bible Gateway and Track.bible are not affliated in any way.
        v-btn(@click='show_chapter_intro = false' v-t='"btn_dismiss"' color='accent' text)
    .iframe(v-else v-html='iframe' :class='{dark: dark}')

    v-toolbar
        v-btn(:to='to_prev_chapter' :disabled='is_first_chapter' icon)
            app-svg(name='icon_chevron_left')

        v-btn(to='../' icon)
            app-svg(name='icon_view_list')

        div.status(@click='open_shortcuts' class='text-truncate')
            span.status_chapter {{ book_name }} {{ chapter }}
            span.status_progress {{ progress_book }}

        v-btn(@click='toggle_read' icon :color='toggle_read_color')
            app-svg(:name='toggle_read_icon')

        v-btn(:to='to_next_chapter' :disabled='is_final_chapter' icon)
            app-svg(name='icon_chevron_right')

    v-dialog(v-model='shortcuts_show')
        v-card(class='pa-3')
            v-card-text
                //- Changing version or chapter instantly applies changes and closes dialog
                component(is='VAutoOrSelect' v-model='shortcuts_version' :items='shortcuts_versions'
                    @change='apply_shortcuts')
                component(is='VAutoOrSelect' v-model='shortcuts_book' :items='shortcuts_books'
                    @change='shortcuts_chapter = 1')
                component(is='VAutoOrSelect' v-model='shortcuts_chapter' :items='shortcuts_chapters'
                    @change='apply_shortcuts')
            v-card-actions(class='justify-center')
                v-btn(@click='apply_shortcuts' text) CONFIRM

</template>


<i18n>
en:
    btn_dismiss: Got it
</i18n>


<script lang='ts'>

import {Component, Vue, Prop} from 'vue-property-decorator'

import data from '@/data/data.json'
import {VAutoOrSelect} from '@/services/misc'


@Component({components: {VAutoOrSelect}})
export default class extends Vue {

    @Prop() book:string
    @Prop() chapter:number

    shortcuts_show = false
    // NOTE This must be initiated as dialog is rendered before being opened
    shortcuts_version = this.$store.state.bible_version
    shortcuts_book = this.book
    shortcuts_chapter = this.chapter

    // DISPLAY

    get iframe(){
        // Return iframe as html so forced to recreate when chapter changes (no old text shown)
        const url = new URL('https://www.biblegateway.com/passage/')
        url.searchParams.set('interface', 'print')
        url.searchParams.set('version', this.$store.state.bible_version)
        url.searchParams.set('search', this.book_name + ' ' + this.chapter)
        return `<iframe sandbox src='${url}'></iframe>`
    }

    get book_name() {
        return this.$store.state.tmp.book_names[this.book]
    }

    get dark() {
        return this.$store.state.dark
    }

    get progress_book() {
        return this.$store.getters.progress_book_str_for(this.book)
    }

    get show_chapter_intro(){
        return this.$store.state.show_chapter_intro
    }

    set show_chapter_intro(value){
        this.$store.commit('set_dict', ['show_chapter_intro', value])
    }

    // CHANGING CHAPTER

    get to_next_chapter() {
        // Returns the next [book, chapter] if there is one
        // WARN translation may not have OT/NT so must test on what books there are
        if (this.chapter < data.num_chapters[this.book]){
            return `/bible/${this.book}/${this.chapter + 1}/`
        } else {
            const next_book = data.books[data.books.indexOf(this.book) + 1]
            if (next_book in this.$store.state.tmp.book_names){
                return `/bible/${next_book}/1/`
            } else {
                return null
            }
        }
    }

    get to_prev_chapter() {
        // Returns the prev [book, chapter] if there is one
        // WARN translation may not have OT/NT so must test on what books there are
        if (this.chapter > 1) {
            return `/bible/${this.book}/${this.chapter - 1}/`
        } else {
            const prev_book = data.books[data.books.indexOf(this.book) - 1]
            if (prev_book in this.$store.state.tmp.book_names) {
                return `/bible/${prev_book}/${data.num_chapters[prev_book]}/`
            } else {
                return null
            }
        }
    }

    get is_first_chapter() {
        return ! this.to_prev_chapter
    }

    get is_final_chapter() {
        return ! this.to_next_chapter
    }

    // TOGGLE READ

    toggle_read() {
        this.$store.dispatch('toggle_ch_read', [this.book, this.chapter])
    }

    get toggle_read_icon(){
        return this.$store.getters.done_books_for(this.book) ? 'icon_done_all' : 'icon_done'
    }

    get toggle_read_color(){
        const ch_done = this.$store.getters.done_chapters_for(this.book, this.chapter)
        return ch_done ? 'accent' : ''
    }

    // SHORTCUTS

    get shortcuts_versions(){
        // Only allow changing to translations of the current locale
        // Multi-lingual study goes beyond scope of app, and UI is very limited already anyway
        const locale_versions = data.versions_by_lang[this.$store.state.locale]
        return locale_versions.map(code => ({value: code, text: data.version_names[code]}))
    }

    get shortcuts_books(){
        return data.books.map(code => ({value: code, text: this.$store.state.tmp.book_names[code]}))
    }

    get shortcuts_chapters(){
        // WARN Get chapters for shortcuts' selected book, not the currently active book
        return Array.from({length: data.num_chapters[this.shortcuts_book]}).map((trash, i) => {
            const num = i + 1
            const title = this.$store.state.tmp.chapter_titles[this.shortcuts_book][num]
            return {value: num, text: `${num} — ${title}`}
        })
    }

    open_shortcuts(){
        // Open shortcuts dialog and reset values to what is actually active
        // NOTE May have changed from prev unconfirmed shortcuts dialog or changing chapter normally
        this.shortcuts_version = this.$store.state.bible_version
        this.shortcuts_book = this.book
        this.shortcuts_chapter = this.chapter
        this.shortcuts_show = true
    }

    apply_shortcuts(){
        // Apply whatever values shortcuts are currently set to
        if (this.shortcuts_version !== this.$store.state.bible_version){
            this.$store.dispatch('change_bible_version', this.shortcuts_version)
        }
        if (this.shortcuts_book !== this.book || this.shortcuts_chapter !== this.chapter){
            this.$router.push(`/bible/${this.shortcuts_book}/${this.shortcuts_chapter}/`)
        }
        this.shortcuts_show = false
    }
}

</script>


<style lang='sass' scoped>


.iframe
    flex-grow: 1
    overflow-y: auto
    height: 100%  // Required by Samsung Browser (tested on 9.4)

.notice
    text-align: center
    padding-top: 50px !important

.status
    display: flex
    flex-direction: column
    align-items: center
    cursor: pointer
    user-select: none

    .status_progress
        margin-top: 2px
        font-size: 13px


::v-deep

    // NOTE iframe is deep because it is manually inserted (Vue doesn't know about it)
    iframe
        width: 100%
        height: 100%
        border-style: none
        // Background required to have uniform white (and for filter to work for dark)
        background-color: #fff
        filter: opacity(0.8)

    .v-toolbar__content
        justify-content: space-around


    .dark iframe
        filter: invert(100%) hue-rotate(180deg) opacity(0.8)


</style>
