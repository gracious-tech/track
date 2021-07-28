
<template lang='pug'>

div
    h2(class='my-5 subtitle-2 text--secondary') Currently reading
    p(class='text-center')
        //- NOTE Not just displayed first time, but also when no books in progress after completing
        v-btn(v-if='!last_progressed.length' @click='choose_book' text color='accent') Choose a book
    v-list
        v-list-item(v-for='book in last_progressed' :key='book.to' :to='book.to')
            v-list-item-content
                v-list-item-title(:class='{"accent--text": book.done}')
                    | {{ book.name }}
                    app-svg(v-if='book.done' name='icon_done' class='ml-2 tick')
            v-list-item-action(v-html='book.progress' class='opacity-secondary body-2')

    h2(class='my-5 subtitle-2 text--secondary') Progress puzzle
    app-puzzle(:click='open_share_dialog')
    p(class='text-center mt-3')
        v-btn(@click='open_share_dialog' text color='accent') SHARE PROGRESS

    h2(class='my-5 subtitle-2 text--secondary') Stats
    v-simple-table(class='mb-6')
        tr
            td Progress
            td
                | {{ progress }}
                span.caption.text--secondary.ml-3
                    | (OT {{ progress_ot }}, NT {{ progress_nt }})
        tr
            td Started
            td {{ duration }}
        tr
            td Completions
            td {{ completions }}

    app-share(ref='app_share')

</template>


<i18n>
</i18n>


<script lang='ts'>
import {Component, Vue} from 'vue-property-decorator'
import {differenceInCalendarMonths} from 'date-fns'

import {sorted_json} from '@/services/utils'
import AppShare from '@/components/reuseable/AppShare.vue'
import AppPuzzle from '@/components/reuseable/AppPuzzle.vue'


@Component({
    components: {AppPuzzle, AppShare},
})
export default class extends Vue {

    get last_progressed(){
        // NOTE Currently limiting to the latest 3 books
        return this.$store.getters.profile.last_progressed.slice(0, 3).map(book => {
            return {
                name: this.$store.state.tmp.book_names[book],
                to: `/bible/${book}/`,
                progress: this.$store.getters.progress_book_html_for(book),
                done: this.$store.getters.done_books_for(book),
            }
        })
    }

    get progress(){
        return this.$store.getters.progress_bible_str
    }

    get progress_ot(){
        return this.$store.getters.progress_ot_str
    }

    get progress_nt(){
        return this.$store.getters.progress_nt_str
    }

    get completions(){
        return this.$store.getters.completions_bible
    }

    get duration(){
        // Return time since started in years/months
        const start = this.$store.getters.profile.current_run_start
        // Work out numbers
        let months = differenceInCalendarMonths(new Date(), start)
        if (months < 1){
            return "Recently"
        }
        const years = Math.floor(months / 12)
        months = months % 12
        // Format into string
        let sentence = `${months} month${months === 1 ? "" : "s"} ago`
        if (years){
            sentence = `${years} year${years === 1 ? "" : "s"}, ${sentence}`
        }
        return sentence
    }

    choose_book(){
        this.$store.commit('set_tmp', ['root_selected_tab', 1])
    }

    open_share_dialog(){
        (this.$refs.app_share as any).open_dialog()
    }

}
</script>


<style lang='sass' scoped>


</style>
