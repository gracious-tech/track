
<template lang='pug'>

svg(@click='click' :viewBox='viewbox' :class='{dark: this.$store.state.dark}')
    //- NOTE Previously was using more suitable clip-path
    //-     but image was briefly revealed in Safari during page animations (and sometimes others)
    image(:xlink:href='"/_assets/optional/puzzles/" + image + ".jpg"' width='100%' height='100%')
    path(v-for='[piece, show] in pieces' :d='piece' :class='{show}')
    text(v-if='no_progress' x='50%' y='50%') Read to reveal

</template>


<script lang='ts'>
import {Component, Vue, Prop} from 'vue-property-decorator'


@Component({})
export default class extends Vue {

    @Prop() click

    total_chapters = 1189  // Protestant Bible chapters count (confirmed with data)
    row_length = 41  // Results in 29 columns (the only possible numbers to divide 1189 by)
    piece_size = 10  // SVG width/height
    piece_left = 'v3.5a1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1 -1.5 1.5v3.5'
    piece_bottom = 'h3.5a1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5 -1.5h3.5'
    piece_right = 'v-3.5a1.5 1.5 0 0 0 1.5 -1.5 1.5 1.5 0 0 0 -1.5 -1.5v-3.5'
    piece_top = 'h-3.5a1.5 1.5 0 0 1 -1.5 1.5 1.5 1.5 0 0 1 -1.5 -1.5h-3.5z'

    get viewbox(){
        const width = this.row_length * this.piece_size
        const height = this.total_chapters / this.row_length * this.piece_size
        return `0 0 ${width} ${height}`
    }

    get no_progress(){
        // Boolean for whether any progress has been made at all
        return ! this.$store.getters.progress_bible[0]
    }

    get image(){
        return this.$store.getters.profile.puzzle
    }

    get pieces(){
        // Return list of SVG d values that form puzzle pieces

        // Get boolean list of chapters' done statuses
        const show = this.$store.getters.chapters_done_flat

        // Generate pieces list
        const pieces = []
        for (let i=0; i < this.total_chapters; i++){

            // Work out position for the piece
            const x = i % this.row_length * this.piece_size
            const y = Math.floor(i / this.row_length) * this.piece_size

            // Give pieces on border straight edges (right/bottom don't matter as extrude only)
            const left = x === 0 ? 'v' + this.piece_size : this.piece_left
            const top = y === 0 ? 'h' + this.piece_size : this.piece_top

            // Form the d value for the piece and add to list
            // WARN order of the edges is important
            const piece = `m ${x} ${y} ${left} ${this.piece_bottom} ${this.piece_right} ${top}`
            pieces.push([piece, show[i]])
        }
        return pieces
    }

}
</script>


<style lang='sass' scoped>


$puzzle_light: #fff
$puzzle_dark: #424242


svg
    width: 100%
    cursor: pointer
    border: 1px solid #0002

    path
        // Make both fill and stroke opaque to avoid showing any gaps between pieces
        fill: $puzzle_light
        stroke: $puzzle_light

        &.show
            // Still show a transparent stroke to show the individual pieces
            // NOTE Color always black to represent shadows (doesn't make sense to be light)
            fill: transparent !important
            stroke: #000 !important
            stroke-opacity: 0.1

    text
        text-anchor: middle
        dominant-baseline: middle
        font-size: 35px
        font-weight: bold
        fill: darken($puzzle_light, 10%)

    &.dark
        border-style: none

        path
            fill: $puzzle_dark
            stroke: $puzzle_dark

        text
            fill: lighten($puzzle_dark, 10%)


</style>
