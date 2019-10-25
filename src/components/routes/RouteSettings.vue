
<template lang='pug'>

div
    v-toolbar(color='primary' dark)
        v-btn(icon to='../')
            app-svg(name='icon_arrow_back')
        v-toolbar-title Settings

    app-content(class='pa-3')

        h2(class='title my-5') Language
        component(is='VAutoOrSelect' v-model='locale' :items.once='locales' label="Language")
        component(is='VAutoOrSelect' v-model='bible_version' :items='bible_versions'
            label="Bible translation" persistent-hint
            hint="For reading chapters, and also for displaying chapter and book names")

        h2(class='title mb-5 mt-7') Toggle features
        v-switch(v-model='percentages' label="Show percentages"
            hint="For example, 50% instead of 2/4 chapters" persistent-hint class='mb-3')
        v-switch(v-model='book_groups' label="Show book groups" persistent-hint class='mb-3'
            hint="Shows subheadings for groups like: Gospels, Paul's Letters, etc")
        v-switch(v-model='celebrations' label="Show fireworks"
            hint="Shows fireworks after you complete books" persistent-hint class='mb-3')
        v-switch(v-model='dark' label="Dark theme")

        h2(class='title mt-5 mb-3') Profiles
        p(class='opacity-secondary body-2') Record progress separately for different groups you are part of. Have separate profiles for your personal, family, or church readings.

        v-list
            v-list-item(v-for='profile in profiles' :key='profile.id')
                v-list-item-content
                    v-list-item-title {{ profile.name }}
                RouteSettingsProfileActions(:profile='profile.id')

        v-dialog(persistent v-model='dialog_add_profile_show')
            template(#activator='{on}')
                v-btn(v-on='on' text) New Profile
            v-card(class='pa-3')
                v-card-title(class='headline') Create new profile
                v-card-text
                    v-text-field(v-model='dialog_add_profile_name' autofocus label='Profile name')
                v-card-actions
                    v-btn(@click='dialog_add_profile_dismiss' text) Cancel
                    v-btn(@click='dialog_add_profile_confirm' :disabled='!dialog_add_profile_name'
                        text color='accent') Create Profile

</template>


<script lang='ts'>

import {Component, Vue} from 'vue-property-decorator'

import data from '@/data/data.json'
import {VAutoOrSelect} from '@/services/misc'
import RouteSettingsProfileActions from '@/components/routes/RouteSettingsProfileActions.vue'


@Component({components: {RouteSettingsProfileActions, VAutoOrSelect}})
export default class extends Vue {

    // GENERAL SETTINGS

    get dark(){
        return this.$store.state.dark
    }

    set dark(value){
        this.$store.commit('set_dict', ['dark', value])
        // Tell Vuetify about the new value
        this.$vuetify.theme.dark = value
    }

    get percentages(){
        return this.$store.state.percentages
    }

    set percentages(value){
        this.$store.commit('set_dict', ['percentages', value])
    }

    get book_groups(){
        return this.$store.state.book_groups
    }

    set book_groups(value){
        this.$store.commit('set_dict', ['book_groups', value])
    }

    get celebrations(){
        return this.$store.state.celebrations
    }

    set celebrations(value){
        this.$store.commit('set_dict', ['celebrations', value])
    }

    get locales(){
        return data.langs.map(code => ({value: code, text: data.lang_names[code]}))
    }

    get locale(){
        return this.$store.state.locale
    }

    set locale(value){
        // Change locale (and must also therefore change translation)
        this.$store.commit('set_dict', ['locale', value])
        // Change to first translation in list for now (unless English)
        // TODO Have recommended default translations for all languages
        this.bible_version = value === 'en' ? 'NIV' : data.versions_by_lang[value][0]
    }

    get bible_versions(){
        // Only allow changing to translations of the selected locale
        // Multi-lingual study goes beyond scope of app, and UI is very limited already anyway
        const locale_versions = data.versions_by_lang[this.$store.state.locale]
        return locale_versions.map(code => ({value: code, text: data.version_names[code]}))
    }

    get bible_version(){
        return this.$store.state.bible_version
    }

    set bible_version(value){
        this.$store.dispatch('change_bible_version', value)
    }

    // PROFILES

    dialog_add_profile_show = false
    dialog_add_profile_name = ''

    get profiles(){
        return this.$store.getters.profiles_sorted.map(id => {
            return {
                id,
                name: this.$store.state.profiles[id].name,
            }
        })
    }

    dialog_add_profile_dismiss(){
        this.dialog_add_profile_name = ''
        this.dialog_add_profile_show = false
    }

    dialog_add_profile_confirm(){
        this.$store.commit('add_profile', this.dialog_add_profile_name.trim())
        this.dialog_add_profile_dismiss()
    }
}

</script>


<style lang='sass' scoped>


</style>
