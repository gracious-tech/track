// Help Typescript understand special webpack-generated modules and also custom properties
// NOTE This should be crawled by Typescript, otherwise try adding in main.ts


declare module '*.vue' {
    import Vue from 'vue'
    export default Vue
}


declare module '*.svg' {
    // This "module" is actually just a string, so `content` is never actually accessible
    const content: string
    export default content
}


interface Window {
    // Custom
    _app
    _store
    _browser_supported:boolean
    _beforeinstallprompt:Event
    _installed:boolean
    _fail(msg:string):void
    _fail_log(msg:string):void
    _fail_alert(msg:string):void
    _error_to_msg(error:Error):string
}


interface Navigator {
    // Missing
    share
    standalone  // ios only
}
