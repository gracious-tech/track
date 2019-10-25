
<template lang='pug'>

app-content.page(class='pa-5 text-center')
    h1(class='headline mb-5') Reset Progress?
    p(class='body-1') You've made some extra progress through some books. Would you like to reset that progress or keep it as a contribution to your next read through the Bible?
    v-list(class='text-left')
        v-list-item(v-for='book in books_with_progress' :key='book.code')
            v-list-item-content
                v-list-item-title {{ book.name }}
            v-list-item-action(v-html='book.progress' class='opacity-secondary body-2')
    p(class='body-2 text--secondary') The number of times books have been completed will still be kept
    p
        //- Margins carefully set for asthetics when buttons wrapped on thin screens
        v-btn(@click='done_keep' outlined class='mx-2 mt-3') Keep progress
        v-btn(@click='done_clear' color='error' class='mx-2 mt-3') Clear progress

</template>


<script lang='ts'>

import {Component, Vue} from 'vue-property-decorator'

import data from '@/data/data.json'


@Component({})
export default class extends Vue {

    get books_with_progress(){
        const store = this.$store
        return data.books.filter(book => store.getters.progress_book_for(book)[0]).map(book => {
            return {
                code: book,
                name: store.state.tmp.book_names[book],
                progress: store.getters.progress_book_str_for(book),
            }
        })
    }

    done_keep(){
        this.$store.dispatch('conclude_completion', false)
    }

    done_clear(){
        this.$store.dispatch('conclude_completion', true)
    }
}

</script>


<style lang='sass' scoped>


.page
    background-color: $primary
    color: $on_primary

</style>
