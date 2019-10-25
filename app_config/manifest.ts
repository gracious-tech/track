// Web App manifest generation


export function generate_manifest(app_config){
    // Generate a Web App manifest and return as JSON
    return JSON.stringify({
        name: app_config.name,
        short_name: app_config.short_name,
        description: app_config.description,
        start_url: '/?manifest',  // Query to identify when starting as an app
        scope: '/',  // Default is where manifest is, so specify to allow manifest in a subdir
        display: 'standalone',
        theme_color: app_config.theme.primary_darker,  // Used in system toolbar while app open
        background_color: app_config.theme.primary,  // Used in splash screen before app loads
        icons: [
            // NOTE Android requires circle icons or will add white circle border
            {src: '/_assets/optional/icons/icon_192_circle.png', type: 'image/png', sizes: '192x192'},
            {src: '/_assets/optional/icons/icon_512_circle.png', type: 'image/png', sizes: '512x512'},
        ],
    })
}
