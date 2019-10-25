
const fs = require('fs')


module.exports = {

    assetsDir: '_assets',

    /* NOTE Despite Vuetify saying this setting is only need for IE11 support, in fact Vuetify also
        uses object = {...object} syntax which is an ES2018 feature!
        Vue CLI is configured to not apply babel to node_modules, so must tell it to here.
    */
    transpileDependencies: ['vuetify'],

    css: {

        // Embed CSS in JS so downloading it doesn't block first paint (progress wheel)
        extract: false,

        loaderOptions: {
            sass: {
                // Make node_modules and variables available in both components and regular files
                data: require('./vue.config.injected_sass').sass_variables,
                includePaths: ['node_modules'],
            },
        },
    },

    configureWebpack: {
        devtool: 'source-map',  // Needed for vscode debug
        optimization: {
            // Webpack by default outputs common modules (for index & app) to a separate file
            // This causes index JS to wait for the "vendors" chunk before executing
            // This happens even if index and app JS have nothing in common, so must be disabled
            // TODO index JS is still mostly just unnecessary webpack module stuff (remove somehow?)
            splitChunks: false,
        },
    },

    chainWebpack: config => {

        // Add entry file for index script
        config.entry('index').add('@/index/index.ts')

        // Default to loading svg files as strings (instead of separate files)
        config.module.rule('svg').uses.clear()
        config.module.rule('svg').use('raw-loader').loader('raw-loader')

        // Before loading, cleanup SVGs (to make inline compatible, not just optimisation)
        config.module.rule('svg').use('svgo-loader').loader('svgo-loader').options({
            // These are in addition to the defaults
            plugins: [
                {'removeXMLNS': true},  // Unnecessary for inline SVGs
                // Don't remove `viewBox` as it's needed for scaling correctly
                // NOTE Also not removing width/height as overwise svg is 100%/100%
                {'removeViewBox': false},  // Default is true
            ],
        })

        // Write i18n data in YAML
        config.module.rule('i18n').use('yaml').loader('yaml-loader')

        // Customise HTML plugin
        config.plugin('html').tap(args => {
            // Manually handle asset injection in index for production (to inline assets)
            args[0].inject = process.env.NODE_ENV === 'development'
            // Load pug index template from custom location
            // WARN Cannot use pug-plain-loader and must use !loader! syntax
            //      The html plugin looks for '!' and changes its behaviour if found
            //      pug-loader returns template fn (rather than string) so plugin can pass in env
            args[0].template = '!!pug-loader!src/index/index.pug'  // Relative to project root
            args[0].templateParameters = (compilation, assets, assetTags, options) => {
                // Extend default vars available in template
                // NOTE These end up with names different to what docs describe but still all there
                //      See `templateParametersGenerator` in source code for details
                return {
                    compilation, assets, assetTags, options,  // Provide all defaults
                    // Own additions
                    node_env: process.env.NODE_ENV,
                    app_config: JSON.parse(fs.readFileSync('src/app_config.json')),
                }
            }
            return args
        })

        // Copy files from static folder
        // NOTE This basically just renames `public` to `static`, but not able to override default
        config.plugin('copy').use(require('copy-webpack-plugin'), [[{from: 'static'}]])

        // Production specific
        if (process.env.NODE_ENV !== 'development'){

            // Regexs for emitted files
            // NOTE Emitted paths are relative but don't have a leading slash
            const match_emit_inlined = /^_assets\/(js|css)\/index\./
            const match_emit_optional = /^_assets\/optional\//
            const match_emit_maps = /\.map$/
            const match_emit_robots = /^robots\.txt$/
            const match_emit_loggers = /^_log_/
            // NOTE URLs match against the whole URL (not just from /)
            // NOTE May be on http when testing locally
            const match_url_versions = /^https?:\/\/[^\/]+\/_assets\/optional\/versions\//
            const match_url_puzzles =  /^https?:\/\/[^\/]+\/_assets\/optional\/puzzles\//
            // NOTE Some settings require matching just the path (rather than whole URL)
            const match_path_non_page = /^\/_/

            // Prevent inlined index assets from getting emitted as separate files as well
            config.plugin('ignore-emit').use(require('ignore-emit-webpack-plugin'),
                [match_emit_inlined])

            // Generate SW
            // WARN This plugin may need to come last to work properly
            // NOTE Deploys both dev and prod assets and uses dev if on localhost (no config)
            // TODO Serve fallback image if offline and new puzzle
            config.plugin('workbox').use(require('workbox-webpack-plugin').GenerateSW, [{

                // Config for SW assets
                importWorkboxFrom: 'local',  // Don't use Google's CDN, host files instead
                importsDirectory: '_assets/sw',  // Place SW assets in this dir
                swDest: 'sw.js',  // Place SW here (must be at root to have permission for all urls)

                // Serve index for any non-asset routes (replicating behaviour in CF)
                // NOTE Can't be '/' as must match asset in manifest
                navigateFallback: '/index.html',  // Serve index.html for other routes
                navigateFallbackBlacklist: [match_path_non_page],  // Should 404 for assets etc

                // Don't precache these
                exclude: [
                    // Exclude completely
                    match_emit_inlined,
                    match_emit_maps,
                    match_emit_robots,
                    match_emit_loggers,
                    // Exclude but may cache some when requested
                    match_emit_optional,
                ],

                // Don't force a redownload of hash'd assets during new SW install
                // As same hash means file hasn't changed and old version can be reused
                dontCacheBustURLsMatching: /\.\w{8}\.\w{1,4}$/,

                // Cache versions and puzzles as they are used
                // NOTE runtime caches given static name and no url hashing (safe to access in page)
                runtimeCaching: [
                    {
                        // Cache puzzles on first load and use cache there after
                        // WARN Reassess if changes made to existing puzzles
                        urlPattern: match_url_puzzles,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'puzzles',
                            // Remove old puzzles so cache doesn't grow too large
                            // Workbox will remove the oldest entries first
                            // Assumed won't have more than 10 profiles and therefore 10 puzzles
                            expiration: {maxEntries: 10},
                        },
                    },
                    {
                        // Always trigger update of cache, but serve cached now if available
                        // Will usually only request version data once per app use, so no big deal
                        urlPattern: match_url_versions,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'bible_versions',
                            expiration: {maxEntries: 15},  // Unlikely to use more than 15 versions
                        },
                    },
                ],
            }])
        }
    },

    pluginOptions: {
        // NOTE These configure Webpack, while any config in main.ts is runtime only
        i18n: {
            locale: 'en',
            fallbackLocale: 'en',
            localeDir: 'locales',
            enableInSFC: true,
        },
    },

}
