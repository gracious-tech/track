
<template lang='pug'>

h1.brand
    app-svg.brand-logo(name='logo_app' :fill='false')
    div.words
        span.brand-track Track
        span.brand-bible(class='ml-1') .bible

</template>


<script lang='ts'>

import {Component, Vue} from 'vue-property-decorator'

@Component({})
export default class extends Vue {}

</script>


<style lang='sass' scoped>

.brand
    text-overflow: clip  // Clip if not enough space, don't ... it
    font-weight: bold
    font-size: 22px
    display: flex

    .brand-logo
        // NOTE min-width required to stop logo shrinking when page too narrow
        min-height: 40px
        min-width: 40px
        max-height: 40px
        max-width: 40px
        margin-right: 4px

    .words
        padding-top: 5px

    .brand-track
        color: #fff

    .brand-bible
        font-size: 0.8em  // em to make scaling with "Track" text easier
        font-variant: small-caps
        color: lighten($accent, 20%)

    &.large
        // 50% increase to all
        font-size: 33px

        .brand-logo
            min-height: 60px
            min-width: 60px

        .words
            padding-top: 8px

</style>
