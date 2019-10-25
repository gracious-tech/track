
<template lang='pug'>

v-list-item-action

    v-menu(bottom left transition='scale-transition' origin='80% 20px')
        template(#activator='{on: on_menu}')
            v-btn(v-on='on_menu' icon)
                app-svg(name='icon_more_vert')
        v-list
            v-list-item(@click='dialog_name_show = true')
                v-list-item-title Change name
            v-list-item(@click='dialog_puzzle_show = true')
                v-list-item-title Change puzzle
            v-list-item(@click='dialog_delete_show = true')
                v-list-item-title Delete

    //- NOTE Not embedding dialogs within v-menu as they get destroyed when the menu closes
    //- See https://git.io/JeYYB

    v-dialog(persistent v-model='dialog_name_show')
        v-card(class='pa-3')
            v-card-title(class='headline') Change name for {{ profile_name }}
            v-card-text
                v-text-field(v-model='dialog_name_value' autofocus label='Profile name')
            v-card-actions
                v-btn(@click='dialog_name_show = false' text) Cancel
                v-btn(@click='dialog_name_confirm' :disabled='!dialog_name_value' text
                    color='accent') Change name

    v-dialog(persistent v-model='dialog_puzzle_show')
        v-card(class='pa-3')
            v-card-title(class='headline') Change puzzle for {{ profile_name }}
            v-card-text
                p(class='body-1') After changing the puzzle you will not be able to return to the current one.
                p(class='body-2') A new photo will be used, but your progress will remain the same.
            v-card-actions
                v-btn(@click='dialog_puzzle_show = false' text) Cancel
                v-btn(@click='dialog_puzzle_confirm' color='error') Change puzzle

    v-dialog(persistent v-model='dialog_delete_show')
        v-card(class='pa-3')
            v-card-title(class='headline') Delete {{ profile_name }}
            v-card-text
                p(class='body-1') This will delete all the progress recorded for this profile and cannot be undone. Are you sure?
                p(v-if='only_one_profile' class='body-1 accent--text') This profile cannot be deleted because it is the last one left.
            v-card-actions
                v-btn(@click='dialog_delete_show = false' text) Cancel
                v-btn(@click='dialog_delete_confirm' :disabled='only_one_profile' color='error')
                    | Delete profile

</template>


<script lang='ts'>

import {Component, Vue, Prop} from 'vue-property-decorator'


@Component({})
export default class extends Vue {

    @Prop() profile

    dialog_name_show = false
    dialog_puzzle_show = false
    dialog_delete_show = false

    dialog_name_value = this.profile_name

    get profile_name(){
        return this.$store.state.profiles[this.profile].name
    }

    get only_one_profile(){
        return Object.keys(this.$store.state.profiles).length === 1
    }

    dialog_name_confirm(){
        const name = this.dialog_name_value.trim()
        this.$store.commit('set_dict', [['profiles', this.profile, 'name'], name])
        this.dialog_name_show = false
    }

    dialog_puzzle_confirm(){
        this.$store.dispatch('change_puzzle', this.profile)
        this.dialog_puzzle_show = false
    }

    dialog_delete_confirm(){
        this.$store.commit('remove_profile', this.profile)
        this.dialog_delete_show = false
    }
}

</script>


<style lang='sass' scoped>


.v-list-item__action
    margin: 0  // Spacing for list item action and menu button together doubles up


</style>
