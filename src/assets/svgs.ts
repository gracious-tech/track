// Module of webpack-embedded svg strings (relies on svgo-loader and raw-loader)


/* WARN Regarding dynamic imports such as with `require()` and `require.context()`

Webpack can import dynamically, but since it (believes) it cannot know the module path until runtime
it instead imports EVERY FILE in the dir so that they'll all be available to choose from.

require(`dir/${name}.svg`) gets turned into require.context('dir', false, /^.*\.svg$/)

And since it does static analysis it cannot import the following:
    path = 'dir/name.js'; require(path)
as it doesn't know what dir it will be in till runtime.

This could be good for importing all files in a dir (if desired), but NOT for some files only.

See https://webpack.js.org/guides/dependency-management

*/


export default {
    // NOTE `require` used only because `export icon from 'icon.svg'` is not possible
    //      Only `export {icon} from 'icon.svg'` is possible (but not suitable)

    // Logos
    logo_app:               require('@/assets/logo_app.svg').default,
    logo_bible_project:     require('@/assets/logo_bible_project.svg').default,

    // Icons
    icon_done:              require('md-icon-svgs/done.svg').default,
    icon_done_all:          require('md-icon-svgs/done_all.svg').default,
    icon_settings:          require('md-icon-svgs/settings.svg').default,
    icon_arrow_back:        require('md-icon-svgs/arrow_back.svg').default,
    icon_more_vert:         require('md-icon-svgs/more_vert.svg').default,
    icon_chevron_left:      require('md-icon-svgs/chevron_left.svg').default,
    icon_chevron_right:     require('md-icon-svgs/chevron_right.svg').default,
    icon_open_in_new:       require('md-icon-svgs/open_in_new.svg').default,
    icon_view_list:         require('md-icon-svgs/view_list.svg').default,
    icon_subject:           require('md-icon-svgs/subject.svg').default,
    icon_group:             require('md-icon-svgs/group.svg').default,
    icon_local_library:     require('md-icon-svgs/local_library.svg').default,
    icon_attach_money:      require('md-icon-svgs/attach_money.svg').default,
    icon_get_app:           require('md-icon-svgs/get_app.svg').default,
    icon_warning:           require('md-icon-svgs/warning.svg').default,
    icon_info:              require('md-icon-svgs/info.svg').default,
    icon_close:             require('md-icon-svgs/close.svg').default,
    icon_share:             require('md-icon-svgs/share.svg').default,
}
