
<template lang='pug'>

v-list
    template(v-for='[group, books] in groups')

        v-subheader(v-if='show_group_headings' v-t='"groups." + group')

        v-list-item(v-for='book in books' :key='book.to' :to='book.to')
            v-list-item-content
                v-list-item-title(:class='{"accent--text": book.done}')
                    | {{ book.name }}
                    app-svg(v-if='book.done' name='icon_done' class='ml-2 tick')
            v-list-item-action(v-html='book.progress' class='opacity-secondary body-2')

        v-divider(v-if='show_group_headings')

</template>


<i18n>

en:
    groups:
        pentateuch: Beginnings
        historical: History
        wisdom: Wisdom
        major: Major Prophets
        minor: Minor Prophets
        gospels: Gospels
        acts: Acts
        paul: Paul's Letters
        letters: Other Letters

</i18n>


<script lang='ts'>

import {Component, Vue, Prop} from 'vue-property-decorator'

import data from '@/data/data.json'


@Component({})
export default class extends Vue {

    @Prop({type: Boolean}) ot:boolean

    get show_group_headings(){
        return this.$store.state.book_groups
    }

    get groups(){
        // Return groups with their books converted to objects for template
        const testament = this.ot ? data.book_groups_ot : data.book_groups_nt
        return testament.map(item => {
            const [group, books] = item
            const book_objects = (books as string[]).map(book => {
                // Return object
                return {
                    name: this.$store.state.tmp.book_names[book],
                    to: `/bible/${book}/`,
                    progress: this.$store.getters.progress_book_html_for(book),
                    done: this.$store.getters.done_books_for(book),
                }
            })
            return [group, book_objects]
        })
    }

    mounted(){
        // Focus (and scroll to) book if just coming from one
        const prev = this.$store.state.tmp.prev_route
        if (prev && prev.path.startsWith('/bible/') && 'book' in prev.params){
            const element = this.$el.querySelector(`[href="/bible/${prev.params.book}/"]`)
            if (element){  // Element should always exist, but just in case...
                (element as HTMLElement).focus()  // Auto-scrolls if not visible
            }
        }
    }
}

</script>


<style lang='sass' scoped>


.v-list

    .v-subheader
        justify-content: center

    .v-list-item__action
        justify-content: flex-end  // Right align


</style>
