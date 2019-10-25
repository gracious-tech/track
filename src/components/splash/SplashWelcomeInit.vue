
<template lang='pug'>

app-content.page(class='pa-3 text-center')

    h2(class='my-5') Initial Progress
    p Tick off books you've already completed (or none if you'd like to start fresh)

    p(class='my-7')
        v-btn(@click='done' outlined) Done

    div(class='text-left')
        v-btn(@click='mark_all' :disabled='all_selected' text class='mr-3') Select all
        v-btn(@click='mark_none' :disabled='none_selected' text) Clear selections

    v-list(class='text-left')
        v-list-item(v-for='book in books' :key='book.code' @click='book.toggle')
            v-list-item-content
                v-list-item-title(:class='{"accent-darker": book.done}')
                    | {{ book.name }}
                    app-svg(v-if='book.done' name='icon_done' class='ml-2 tick')

    p(class='mt-3')
        v-btn(@click='done' outlined) Done

</template>


<script lang='ts'>

import {Component, Vue} from 'vue-property-decorator'

import data from '@/data/data.json'


@Component({})
export default class extends Vue {

    books_read

    constructor(){
        super()
        // Init books_read
        this.books_read = {}
        data.books.forEach(book => {
            this.books_read[book] = false
        })
    }

    get books(){
        // Get list of objects with properties for each book
        return data.books.map(book => {
            return {
                code: book,
                name: this.$store.state.tmp.book_names[book],
                done: this.books_read[book],
                toggle: () => {
                    this.books_read[book] = ! this.books_read[book]
                },
            }
        })
    }

    get all_selected(){
        return Object.values(this.books_read).every(v => v as boolean)
    }

    get none_selected(){
        return Object.values(this.books_read).every(v => ! v as boolean)
    }

    mark_all(){
        for (const book of data.books){
            this.books_read[book] = true
        }
    }

    mark_none(){
        for (const book of data.books){
            this.books_read[book] = false
        }
    }

    done(){
        // If all books selected, just increment whole bible read count
        if (this.all_selected){
            this.$store.dispatch('set_profile', ['completions_bible', 1])
        } else {
            // Mark ticked books as read and increase their counts
            for (const book of data.books){
                if (this.books_read[book]){
                    this.$store.dispatch('set_profile', [['done_books', book], true])
                    this.$store.dispatch('set_profile', [['completions_books', book], 1])
                }
            }
        }

        // Show root (in case someone shared app via a deep link)
        // WARN Should come before hiding splash to prevent prev route being rendered briefly
        this.$router.replace('/')

        // Prevent showing this again
        this.$store.commit('set_dict', ['show_splash_welcome_init', false])

    }
}

</script>


<style lang='sass' scoped>

.page
    background-color: $primary
    color: $on_primary

h2
    font-size: 30px
    font-weight: 500

h3
    font-size: 22px
    font-weight: 400

.accent-darker
    color: $accent_darker  // Easier to read on primary

</style>
