// App config script that generates src/app_config.json

const yaml = require('js-yaml')  // Couldn't get ES6 import to work
import {resolve} from 'path'
import {writeFileSync, readFileSync} from 'fs'

import {generate_theme} from './theme_generation'
import {generate_manifest} from './manifest'


// Import config
const config = yaml.load(readFileSync(resolve(__dirname, 'app_config.yaml')))


// Generate colors from codes
generate_theme(config)


// Write final config
writeFileSync(resolve(__dirname, '../src/app_config.json'), JSON.stringify(config))


// Write manifest
// TODO Generate via webpack in future (perhaps with ExtractTextPlugin though couldn't work out)
writeFileSync(resolve(__dirname, '../static/_assets/manifest.json'), generate_manifest(config))
