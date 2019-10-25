// Generation of sass variables to provide to all sass files during webpack build

const app_config = require('./src/app_config.json')


/* Notes on Vuetify variables and styles

Locations of useful Vuetify application-wide classes
    node_modules/vuetify/src/styles/elements/_typography.sass
    node_modules/vuetify/src/styles/generic/_elevation.scss
    node_modules/vuetify/src/styles/generic/_transitions.scss

Locations of useful Vuetify sass variables
    node_modules/vuetify/src/styles/settings/_dark.scss
    node_modules/vuetify/src/styles/settings/_light.scss
    node_modules/vuetify/src/styles/settings/_variables.scss

NOTE .secondary--text & .text--secondary are different!

*/


// Generate string of variables (ideally keep as simple as possible)
// NOTE For variables ONLY (put styles in generic_styles.sass)
let sass_variables = `
@import 'vuetify/src/styles/styles.sass'
$header-width: 800px
$content-width: 600px
`

// Inject theme variables in
for (const [key, value] of Object.entries(app_config.theme)){
    sass_variables += `$${key}: ${value}\n`
}


module.exports = {sass_variables}
