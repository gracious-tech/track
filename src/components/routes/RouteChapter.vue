
<template lang='pug'>

iframe(ref='iframe' :src='src')

</template>


<script lang='ts'>

import {Component, Vue, Prop} from 'vue-property-decorator'

import app_config from '@/app_config.json'
import {FETCH_ORIGIN, books_old_to_new} from '@/services/fetch'


@Component({})
export default class extends Vue {

    @Prop() book:string
    @Prop() chapter:number

    src:string

    created(){
        const params = new URLSearchParams([
            ['dark', `${this.$store.state.dark}`],
            ['color', app_config.theme.primary],
            ['back', 'true'],
            ['chapter', `${this.chapter}`],
            ['book', books_old_to_new[this.book]],
        ])
        this.src = `${FETCH_ORIGIN}/#${params}`
    }

}

</script>


<style lang='sass' scoped>

iframe
    border-style: none


</style>
