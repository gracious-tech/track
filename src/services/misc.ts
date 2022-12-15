// Utils that have dependencies or are app-specific

import {VSelect} from 'vuetify/lib/components/VSelect'
import {VAutocomplete} from 'vuetify/lib/components/VAutocomplete'

import app_config from '@/app_config.json'


// VERSION


export const version = app_config.version
export const prerelease = self.location.hostname.startsWith('next.') ? 'test' : null


// COMPONENTS


export const VAutoOrSelect = (() => {
    // Return either an autocomplete or a select component depending on viewport height
    // Autocomplete useful to filter long lists, but opens a keyboard on mobiles resulting in bad UX
    const keyboard_height = 260
    const autocomplete_desired_height = 550
    const required_height = keyboard_height + autocomplete_desired_height
    return self.innerHeight > required_height ? VAutocomplete : VSelect
})()
