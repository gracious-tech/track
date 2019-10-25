// Code to be embedded in index.html during build
// NOTE Declare window-level properties and methods in `services/types.d.ts`

// Trigger packaging of index's styles
import './index.sass'


// Handle errors


self._fail_log = msg => {
    // Make request with error message in URL (for server to log upon 404)
    // NOTE CloudFront still logs 404s, even if they are converted to 200s

    // Encode and insert msg into URL
    let url = '/_log_error?m=' + encodeURIComponent(msg)
    url = url.substr(0, 1950)  // 2000 limit - 50 scheme/domain

    // Send request and ignore response (HEAD saves bandwidth)
    // WARN Still need to catch as if offline will cause recursive error handling
    fetch(url, {method: 'HEAD'}).catch(() => null)
}


self._fail_alert = msg => {
    // Show alert with option to reload/clear-data or contact developers

    // Don't show if a fail splash already exists
    if (self.document.querySelector('.fail-splash') !== null){
        return
    }

    // TODO Button to reset app or contact developers

    // Show the alert
    self.document.body.innerHTML += `
        <div class="fail-splash error">
            <h1>Fail :(</h1>
            <p class='btn-wrap'><button onclick="location.reload(true)">TRY TO RECOVER</button></p>
            <pre></pre>
        </div>
    `
    self.document.body.querySelector('.fail-splash.error pre').textContent = msg
}


self._error_to_msg = error => {
    // Convert an error object into a string (standard toString doesn't include stack)
    // NOTE Chrome (and probably others too) ONLY has properties name, message, and stack
    // NOTE While Chrome includes name/message in the stack, Firefox and Safari do not
    return `${error.name}: ${error.message}\n\n${error.stack}`
}


self._fail = msg => {
    // Handle app failure

    // Do nothing if not supported, as don't want to fill error logs, and splash shown by index.pug
    if (!self._browser_supported){
        return
    }

    // Log error and show alert
    self._fail_log(msg)
    self._fail_alert(msg)
}

self.addEventListener('error', event => {
    // Handle uncaught errors
    // NOTE error property should always exist, but fallback on message (also if a custom throw?)
    const msg = event.error ? self._error_to_msg(event.error) : event.message
    self._fail(msg)
})


self.addEventListener('unhandledrejection', event => {
    // Handle uncaught errors in promises (service worker also reports errors via this)
    // NOTE Unlike regular error events, these ones rarely stop app working, so logging only
    //      Workbox also likes to throw errors during network failure which come through here
    console.error(event)  // tslint:disable-line:no-console
    let msg = event.reason
    if (msg instanceof Error){
        msg = self._error_to_msg(msg)
    }
    self._fail_log('[rejection] ' + msg)
})


// Redirect www


if (window.location.hostname.startsWith('www.')){
    const non_www = window.location.href.replace('www.', '')
    // NOTE `replace` is like HTTP redirect, excluding page from history (avoids back-redirect loop)
    window.location.replace(non_www)
}
