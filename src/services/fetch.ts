
import app_config from '@/app_config.json'


export const books_old_to_new = {
    'gen': 'gen',
    'exod': 'exo',
    'lev': 'lev',
    'num': 'num',
    'deut': 'deu',
    'josh': 'jos',
    'judg': 'jdg',
    'ruth': 'rut',
    '1sam': '1sa',
    '2sam': '2sa',
    '1kgs': '1ki',
    '2kgs': '2ki',
    '1chr': '1ch',
    '2chr': '2ch',
    'ezra': 'ezr',
    'neh': 'neh',
    'esth': 'est',
    'job': 'job',
    'ps': 'psa',
    'prov': 'pro',
    'eccl': 'ecc',
    'song': 'sng',
    'isa': 'isa',
    'jer': 'jer',
    'lam': 'lam',
    'ezek': 'ezk',
    'dan': 'dan',
    'hos': 'hos',
    'joel': 'jol',
    'amos': 'amo',
    'obad': 'oba',
    'jonah': 'jon',
    'mic': 'mic',
    'nah': 'nam',
    'hab': 'hab',
    'zeph': 'zep',
    'hag': 'hag',
    'zech': 'zec',
    'mal': 'mal',
    'matt': 'mat',
    'mark': 'mrk',
    'luke': 'luk',
    'john': 'jhn',
    'acts': 'act',
    'rom': 'rom',
    '1cor': '1co',
    '2cor': '2co',
    'gal': 'gal',
    'eph': 'eph',
    'phil': 'php',
    'col': 'col',
    '1thess': '1th',
    '2thess': '2th',
    '1tim': '1ti',
    '2tim': '2ti',
    'titus': 'tit',
    'phlm': 'phm',
    'heb': 'heb',
    'jas': 'jas',
    '1pet': '1pe',
    '2pet': '2pe',
    '1john': '1jn',
    '2john': '2jn',
    '3john': '3jn',
    'jude': 'jud',
    'rev': 'rev',
}

export const books_new_to_old =
    Object.fromEntries(Object.entries(books_old_to_new).map(([a, b]) => [b, a]))




export const FETCH_ORIGIN =
    process.env.NODE_ENV === 'production' ? 'https://app.fetch.bible' : 'http://localhost:8431'

const icon_done = 'M24.05 45.25q-4.55 0-8.45-1.625Q11.7 42 8.85 39.15 6 36.3 4.375 32.4 2.75 28.5 2.75 23.95q0-4.45 1.625-8.325Q6 11.75 8.85 8.875 11.7 6 15.6 4.35 19.5 2.7 24 2.7q3.75 0 7 1.125T36.95 7l-3.5 3.45q-1.95-1.4-4.325-2.2-2.375-.8-5.125-.8-7.05 0-11.8 4.725Q7.45 16.9 7.45 24t4.75 11.825Q16.95 40.55 24 40.55q7.05 0 11.8-4.725Q40.55 31.1 40.55 24q0-1.25-.2-2.45-.2-1.2-.55-2.3l3.75-3.8q.85 2 1.3 4.125.45 2.125.45 4.375 0 4.55-1.65 8.45-1.65 3.9-4.525 6.75-2.875 2.85-6.75 4.475Q28.5 45.25 24.05 45.25Zm-3.1-11.4L12.15 25l3.25-3.3 5.55 5.55L42 6.2l3.35 3.3Z'
const icon_done_all = 'M24 45.25q-4.5 0-8.4-1.625Q11.7 42 8.85 39.15 6 36.3 4.375 32.4 2.75 28.5 2.75 23.95q0-4.45 1.625-8.325Q6 11.75 8.85 8.875 11.7 6 15.6 4.35 19.5 2.7 24 2.7q3.75 0 7 1.125T36.95 7l-3.5 3.45q-1.95-1.4-4.325-2.2-2.375-.8-5.125-.8-7.05 0-11.8 4.725Q7.45 16.9 7.45 24t4.75 11.825Q16.95 40.55 24 40.55q1.65 0 3.175-.3t2.975-.9l3.6 3.65q-2.2 1.1-4.65 1.675t-5.1.575Zm13.65-4.9v-6h-6v-4.7h6v-6h4.7v6h6v4.7h-6v6Zm-16.7-6.5L12.15 25l3.25-3.3 5.55 5.55L42 6.2l3.35 3.3Z'


interface FetchBibleEvent {
    type:'ready'|'translation'|'verse'|'back'|'button1'|'dark'
    languages:[string, ...string[]]
    translations:[string, ...string[]]
    book:string
    chapter:number
    verse:number
    dark:boolean
}


// Listen to fetch(bible) iframe and respond
self.addEventListener('message', event => {

    // SECURITY Only listen to events from fetch(bible)
    if (event.origin !== FETCH_ORIGIN){
        return
    }

    // Unpack data
    const data = event.data as FetchBibleEvent
    const old_book = books_new_to_old[data.book]

    // Event types
    if (data.type === 'back'){
        // Leave route if back clicked
        self._app.$router.push('../')

    } else if (data.type === 'button1'){
        // Respond to tick button
        self._app.$store.dispatch('toggle_ch_read', [old_book, data.chapter])

    } else if (data.type === 'dark'){
        // Update dark setting
        self._app.$store.commit('set_dict', ['dark', data.dark])
        // Tell Vuetify about the new value
        self._app.$vuetify.theme.dark = data.dark

    } else if (data.type === 'verse'){
        // Respond to chapter change (ignore other changes)
        if (self._app.$route.params.book !== old_book
                || parseInt(self._app.$route.params.chapter, 10) !== data.chapter){

            // Change route so back nav works
            // WARN Don't change if no longer viewing chapter comp, as will interfer with back btn
            if (self._app.$route.name === 'chapter'){
                self._app.$router.push({
                    name: 'chapter',
                    params: {book: old_book, chapter: data.chapter},
                })
            }

        }
    }

    // If source still exists (it may not) reply with desired state
    if (event.source && data.type !== 'back'){
        const reply = {
            type: 'update',
            status: self._app.$store.getters.progress_book_str_for(old_book),
            button1_icon: self._app.$store.getters.done_books_for(old_book)
                ? icon_done_all : icon_done,
            button1_color: self._app.$store.getters.done_chapters_for(old_book, data.chapter)
                ? app_config.theme.accent : '',
        }
        ;(event.source as Window).postMessage(reply, FETCH_ORIGIN)
    }
})
