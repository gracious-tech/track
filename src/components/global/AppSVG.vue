
<template lang='pug'>

//- SVG attributes are unpacked so that <svg> can be at top level
svg(:viewBox='viewbox' :width='width' :height='height' v-html='contents' :class='{fill}')

</template>


<script lang='ts'>
import {Component, Prop, Vue, Watch, Inject} from 'vue-property-decorator'

import svgs from '@/assets/svgs'


@Component({})
export default class extends Vue {

    // WARN undefined values will NOT be reactive!
    viewbox:string = ''
    width:string = ''
    height:string = ''
    contents:string = ''

    @Prop() name:string

    @Prop({default: true, type: Boolean}) fill:boolean

    @Watch('name', {immediate: true}) watch_name(value){
        // Allow easier debugging for missing svgs
        if (! (value in svgs)) {
            throw new Error(`No svg named '${value}' is available`)
        }
        // Parse the SVG
        // WARN 'text/html' caused issues in iOS 10.3
        const doc = new DOMParser().parseFromString(svgs[value], 'image/svg+xml')
        // Retrieve the SVG element from the resulting document
        const svg = doc.firstChild as HTMLElement
        // Extract the attribute values and also the element's inner HTML
        // WARN Case matters for `viewBox` (both getting it and setting it)
        this.viewbox = svg.attributes.getNamedItem('viewBox').value
        this.width = svg.attributes.getNamedItem('width').value
        this.height = svg.attributes.getNamedItem('height').value
        this.contents = svg.innerHTML
    }
}
</script>


<style lang='sass' scoped>


svg.fill
    // While most icons will want to be same color as text
    // WARN Black paths in SVG may be exported as no-color and default to fill setting
    //      So SVGs with black paths that should remain black will want to disable fill setting
    fill: currentColor


</style>
