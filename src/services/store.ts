
import Vue from 'vue'
import {Route} from 'vue-router'
import {Store, StoreOptions} from 'vuex'
import {openDB, DBSchema, IDBPDatabase} from 'idb'

import data from '@/data/data.json'
import {Celebrations} from '@/services/celebrations'
import {nested_objects_set, NestedKeyMissing, catch_only, install_averse, fetch_ensure_cached,
    } from '@/services/utils'


// TYPES


interface AppState {

    dark:boolean
    percentages:boolean
    celebrations:boolean
    book_groups:boolean
    locale:string
    bible_version:string
    share_last_read:boolean

    show_splash_welcome:boolean
    show_splash_welcome_init:boolean
    show_splash_install_averse:boolean
    show_install_banner:boolean
    show_chapter_intro:boolean  // TODO rm from db
    last_url:string
    offline_opens:number

    profile:string
    profiles:{
        [profile_id:string]:{
            name:string,
            puzzle:string,
            completed_puzzle_dismissed:boolean,
            last_completed:string,
            last_progressed:string[],
            current_run_start:Date,
            completions_bible:number,
            completions_books:{
                [book:string]:number,
            },
            done_books:{
                [book:string]:boolean,
            },
            done_chapters:{
                [book:string]:{
                    [chapter:number]:boolean,
                },
            },
        },
    }

    tmp:{
        root_selected_tab:number,
        book_names:{
            [book:string]:string,
        },
        chapter_titles:{
            [book:string]:{
                [chapter:number]:string,
            },
        },
        prev_route:Route,
    }
}


type db_value = string|string[]|number|boolean|null|Date


interface StateDatabase extends DBSchema {
    dict:{
        key:string,  // The type of whatever key is used (in this case it's value.key)
        value:{
            key:string,
            value:db_value,
        },
    },
    profile_ids:{
        key:string,
        value:{
            id:string,
        },
    }
}


// STATE UTILS


const KEY_SEPARATOR = '$'


function new_profile_id(db){
    // Generate new profile id, register in db, and return
    // NOTE While theoretically '0' could be generated, it is so unlikely not to worry about
    const id = `${Math.random()}`.slice(2)  // Excludes the leading '0.' leaving just digits
    db.put('profile_ids', {id})
    return id
}


function get_random_puzzle_id(){
    // Return a random puzzle id (as zero-padded string)
    const num_of_puzzles = 100  // NOTE puzzle ids start from 0, so last puzzle is 99
    const random = Math.floor(Math.random() * num_of_puzzles)  // random can be 0 but not 1
    const puzzle_id = `${random}`.padStart(3, '0')

    // Trigger cache
    // TODO Handle network failure and move somewhere more appropriate
    fetch_ensure_cached('puzzles', `/_assets/optional/puzzles/${puzzle_id}.jpg`)

    return puzzle_id
}


function get_blank_profile(){
    // Return a blank profile with no progress
    return {
        name: "Personal reading",  // Will be used for first profile
        puzzle: '000',  // Shouldn't ever be used (just here in case)
        completed_puzzle_dismissed: false,
        last_completed: null,
        last_progressed: [],
        current_run_start: new Date(),  // Shouldn't ever be used (init'd when profile created)
        completions_bible: 0,
        completions_books: data.books.reduce((obj, book) => {
            obj[book] = 0
            return obj
        }, {}),
        done_books: data.books.reduce((obj, book) => {
            obj[book] = false
            return obj
        }, {}),
        done_chapters: data.books.reduce((obj, book) => {
            // Generates {book: {ch: false, ...},...}
            obj[book] = {}
            for (let chapter = 1; chapter <= data.num_chapters[book]; chapter++) {
                obj[book][chapter] = false
            }
            return obj
        }, {}),
    }
}


function set_dict_storeless(db, state, [key_or_keys, value]){
    // Set value for state and save in db (usable before store init'd)

    // May have been given single key string, so convert to array to make simpler
    // NOTE Copy key_or_keys so original preserved for Vuex debugger to access
    const keys = Array.isArray(key_or_keys) ? key_or_keys.slice() : [key_or_keys]
    const db_key = keys.join(KEY_SEPARATOR)
    nested_objects_set(state, keys, value)
    // NOTE Below is async but does not affect app at all so ok in mutation
    db.put('dict', {key: db_key, value})
}


function add_profile_storeless(db, state, name=null){
    // Add a new profile and activate it (usable before store init'd)

    // Generate new profile id and store in db
    const profile_id = new_profile_id(db)

    // Assign empty profile in store
    // WARN Must tell Vue whenever adding/deleting a property on an object
    Vue.set(state.profiles, profile_id, get_blank_profile())

    // Generate puzzle id, set and save (also name if given)
    set_dict_storeless(db, state, [['profiles', profile_id, 'puzzle'], get_random_puzzle_id()])
    if (name){
        set_dict_storeless(db, state, [['profiles', profile_id, 'name'], name])
    }

    // Set start date since dynamic and must be saved in db (not defaulted)
    set_dict_storeless(db, state, [['profiles', profile_id, 'current_run_start'], new Date()])

    // Switch to the new profile
    set_dict_storeless(db, state, ['profile', profile_id])
}


async function get_version_data(bible_version){
    // Get version data for the given version (return null if can't)
    // TODO Currently hardcoded to NET data
    const url = `/_assets/optional/versions/NET.json`
    const resp = await fetch_ensure_cached('bible_versions', url)
    return resp ? resp.json() : null
}


// STATE


async function get_initial_state(db:IDBPDatabase<StateDatabase>):Promise<AppState>{

    // Get existing profile ids
    // NOTE Since number of profiles indefinite must keep track of their ids in separate db store
    //      This allows two tabs to add/remove profiles without overwriting each other
    const profile_ids = (await db.getAll('profile_ids')).map(obj => obj.id)

    // Init profiles with empty data
    const profiles = {}
    profile_ids.forEach(profile_id => {
        profiles[profile_id] = get_blank_profile()
    })

    // Construct full state with defaults
    const state = {

        // Preferences
        dark: true,
        percentages: true,
        celebrations: true,
        book_groups: true,
        locale: 'en',
        bible_version: 'NIV',
        share_last_read: true,

        // Private state
        show_splash_welcome: true,
        show_splash_welcome_init: true,
        show_splash_install_averse: install_averse(),
        show_install_banner: true,
        show_chapter_intro: true,
        last_url: '/',
        offline_opens: 0,

        profile: null,
        profiles,

        // Tmp
        tmp: {
            root_selected_tab: 0,
            book_names: null,
            chapter_titles: null,
            prev_route: null,
        },
    }

    // Get stored values
    const items = await db.getAll('dict')

    // Override store defaults with all stored values
    // NOTE Values are only written when changed, so many keys will not have values stored
    for (const item of items){
        try {
            nested_objects_set(state, item.key.split(KEY_SEPARATOR), item.value)
        } catch (error){
            catch_only(NestedKeyMissing, error)
            // Key is obsolete (from old app version or old profile residue from mulitple tabs)
            // TODO Logging for now, for review later and possible auto-deletion if safe
            // WARN Do NOT expose any user data (key should be ok, but value not)
            self._fail_log(`Obsolete key detected: ${item.key}`)
        }
    }

    // Resolve impossible state conditions
    // These may occur from having two tabs open, interacting, then refreshing one
    // NOTE Doing after store created will cause issues as getters will be inited too etc
    // NOTE This app only loads from db on startup, so cannot be corrupted during operation
    if (!state.profile){
        // Profile is null so must be first load and new profile needed
        add_profile_storeless(db, state)
    }
    if (! (state.profile in state.profiles)){
        // Active profile doesn't exist (may have been deleted by another tab)
        const random_profile = Object.keys(state.profiles)[0]
        set_dict_storeless(db, state, ['profile', random_profile])
    }

    // Load book and chapter names into state
    // NOTE Assume we're online or version data already cached
    // TODO Reassess above (will it be cached if first loaded before SW active?)
    const version_data = await get_version_data(state.bible_version)
    state.tmp.book_names = version_data.book_names
    state.tmp.chapter_titles = version_data.chapter_titles

    // Return the state
    // NOTE State corruptions resolved in `ensure_integrity` so can access store actions
    // WARN Do not return until updating it has finished (await all async tasks)
    return state
}


// STORE METHOD UTILS


function filterable_bible_progress(profile, exclude=[]):[number, number]{
    // Return Bible progress except exclude the given books
    let chapters_total = 0
    let chapters_read = 0
    for (const [book, book_read] of Object.entries(profile.done_books)){
        if (exclude.includes(book)){
            continue
        }
        for (const ch_read of Object.values(profile.done_chapters[book])){
            chapters_total += 1
            // NOTE book may have been read but chapter false due to ability to reread books
            if (book_read || ch_read){
                chapters_read += 1
            }
        }
    }
    return [chapters_read, chapters_total]
}


function fractionise(state, [read, total]){
    if (state.percentages){
        return Math.floor(read / total * 100) + '%'
    } else {
        return read + '/' + total
    }
}


const celebrations = new Celebrations()


// STORE METHODS


async function get_store_options(db:IDBPDatabase<StateDatabase>)
        :Promise<StoreOptions<AppState>>{return {

    strict: process.env.NODE_ENV !== 'production',  // Expensive, so don't run in production
    state: await get_initial_state(db),

    getters: {

        // NO ARG GETTERS

        profile(state){
            return state.profiles[state.profile]
        },

        profile_complete(state, getters){
            // Return whether current profile has whole Bible completed
            return Object.values(getters.profile.done_books).every(i => i)
        },

        profile_initials(state, getters){
            // Return simplest possible initials for current profile name that uniquely identify it

            // Helper to remove whitespace from names to make comparing easier
            const reduce = n => n.replace(/\s+/g, '')

            // Get current profile's name
            const name = reduce(getters.profile.name)

            // Get other names that start with same initial
            const others = Object.keys(state.profiles).filter(key => key !== state.profile)
                .map(key => reduce(state.profiles[key].name)).filter(n => n.startsWith(name[0]))

            // Return only one char if unique (or only one char in name), otherwise two
            if (!others.length || name.length === 1){
                return name[0]
            } else {
                return name[0] + name[1]
            }
        },

        profiles_sorted(state){
            // Return list of profile ids sorted by their name
            const ids = Object.keys(state.profiles)
            ids.sort((a, b) => {
                a = state.profiles[a].name
                b = state.profiles[b].name
                return a.localeCompare(b)
            })
            return ids
        },

        completions_bible(state, getters){
            return getters.profile.completions_bible
        },

        progress_bible(state, getters){
            return filterable_bible_progress(getters.profile)
        },

        progress_bible_str(state, getters){
            // Return Bible progress as percent or fraction (always displays, even for 0)
            return fractionise(state, getters.progress_bible)
        },

        progress_ot_str(state, getters){
            const num_books_in_ot = 39
            const excludes = data.books.slice(num_books_in_ot)
            return fractionise(state, filterable_bible_progress(getters.profile, excludes))
        },

        progress_nt_str(state, getters){
            const num_books_in_ot = 39
            const excludes = data.books.slice(0, num_books_in_ot)
            return fractionise(state, filterable_bible_progress(getters.profile, excludes))
        },

        chapters_done_flat(state, getters){
            // Return flat array of done bools for all chapters (not grouped by books)
            const done = []
            for (const book of data.books){
                const book_read = getters.done_books_for(book)
                for (let chapter=1; chapter <= data.num_chapters[book]; chapter++){
                    done.push(book_read || getters.done_chapters_for(book, chapter))
                }
            }
            return done
        },

        share_data(state, getters){
            // Return data needed for creating shareable image

            // Get book most recently progressed in and decide whether to show it
            // Not showing if bible complete as looks strange to see 100% and currently reading
            const current_book = getters.profile.last_progressed[0] || null  // undefined -> null
            const show_current_book = state.share_last_read && !getters.profile_complete

            return {
                puzzle_id: getters.profile.puzzle,
                chapters: getters.chapters_done_flat,
                recent_book: state.share_last_read ? getters.profile.last_completed : null,
                current_book: show_current_book ? current_book : null,
                bible_version: state.bible_version,
                locale: state.locale,
            }
        },

        // BOOK GETTERS

        completions_books_for(state, getters){
            return book => getters.profile.completions_books[book]
        },

        done_books_for(state, getters){
            return book => getters.profile.done_books[book]
        },

        progress_book_for(state, getters){
            // NOTE This is progress of current read/reread (may have read already)
            return book => {
                let chapters_total = 0
                let chapters_read = 0
                for (const is_read of Object.values(getters.profile.done_chapters[book])){
                    chapters_total += 1
                    if (is_read){
                        chapters_read += 1
                    }
                }
                return [chapters_read, chapters_total]
            }
        },

        progress_book_str_for(state, getters){
            return book => {
                return fractionise(state, getters.progress_book_for(book))
            }
        },

        progress_book_html_for(state, getters){
            // Return progress for book as a HTML string (percent & read count)
            return book => {
                let stats = ''
                const [read, total] = getters.progress_book_for(book)
                if (read){
                    stats += getters.progress_book_str_for(book)
                }
                const completions = getters.profile.completions_books[book]
                if (completions){
                    stats += ` <sup>× ${completions}</sup>`
                }
                return stats
            }
        },

        book_videos_for(state){
            // Return array of videos for given book in current locale
            return book => {
                // Get videos in locale of user if possible, else fallback on English videos
                if (state.locale in data.video_ids && book in data.video_ids[state.locale]){
                    return data.video_ids[state.locale][book]
                }
                return data.video_ids.en[book]
            }
        },

        // CHAPTER GETTERS

        done_chapters_for(state, getters){
            return (book, ch) => getters.profile.done_chapters[book][ch]
        },
    },

    mutations: {

        set_dict(state, [key_or_keys, value]:[string|string[], db_value]){
            // Both set a value in the store and save it in the db
            set_dict_storeless(db, state, [key_or_keys, value])
        },

        set_tmp(state, [key, value]){
            // Set a value in the store's tmp object (not saved to db)
            state.tmp[key] = value
        },

        add_profile(state, name){
            // Add a new profile and switch to it
            // NOTE Manually mutates state so can't be an action
            add_profile_storeless(db, state, name)
        },

        remove_profile(state, profile){
            // Remove a profile from the store and from db
            // WARN Assumes not the last profile
            // NOTE Manually mutates state so can't be an action

            // Remove the profile from state
            Vue.delete(state.profiles, profile)
            if (state.profile === profile){
                // WARN Make sure profile already removed before randomly selecting one to change to
                const random_profile = Object.keys(state.profiles)[0]
                set_dict_storeless(db, state, ['profile', random_profile])
            }

            // Remove the profile from the db
            db.delete('profile_ids', profile)
            db.getAllKeys('dict').then(keys => {
                for (const key of keys){
                    if (key.startsWith('profiles' + KEY_SEPARATOR + profile + KEY_SEPARATOR)){
                        db.delete('dict', key)
                    }
                }
            })
        },
    },

    actions: {

        // ACTIONS FOR APP

        resolve_check_all({dispatch}){
            // TODO Check all profiles, not just the current one
            // Ensure all chapters and/or all books not ticked (resolve as a completion instead)
            // NOTE Ideally this would happen before store created, but store methods make easier
            for (const book of data.books){
                dispatch('resolve_all_read_chapters', [book, false])
            }
        },

        conclude_completion({getters, dispatch, commit, state}, reset_chapters){
            // Conclude the completion of the current profile

            // Go to root now as the splash will auto disappear once any book is reset to unread
            commit('set_tmp', ['root_selected_tab', 0])
            self._app.$router.push('/')

            // Increment count
            dispatch('set_profile', ['completions_bible', getters.profile.completions_bible + 1])

            // Reset start date
            dispatch('set_profile', ['current_run_start', new Date()])

            // Change puzzle
            dispatch('change_puzzle', state.profile)

            // If resetting chapters, then nothing recently progressed in
            if (reset_chapters){
                dispatch('set_profile', ['last_progressed', []])
            }

            // Reset done status for all books (and optionally chapters too)
            // WARN This will cause the completion splash to disappear
            for (const book of data.books){
                dispatch('set_profile', [['done_books', book], false])
                if (reset_chapters){
                    dispatch('reset_chapters', book)
                }
            }

            // Reset completed_puzzle_dismissed in prep for next completion
            // WARN Reset last, else will cause initial completion splash to appear again
            dispatch('set_profile', ['completed_puzzle_dismissed', false])
        },

        // ACTIONS FOR BOOKS

        bulk_complete_book({dispatch}, book){
            // Complete the book regardless if all chapters ticked yet or not
            dispatch('resolve_all_read_chapters', [book, true])  // true to force
        },

        bulk_unread_book({dispatch}, book){
            // Unread all chapters for given book and unread the book
            dispatch('reset_chapters', book)
            dispatch('set_profile', [['done_books', book], false])
        },

        decrease_completions_for_book({getters, dispatch}, book){
            // Decrease the number of times a book has been completed
            const count = Math.max(getters.profile.completions_books[book] - 1, 0)
            dispatch('set_profile', [['completions_books', book], count])
        },

        reset_chapters({getters, dispatch}, book){
            // Reset all the chapters in a book to false
            for (const [ch, done] of Object.entries(getters.profile.done_chapters[book])){
                if (done){
                    dispatch('set_profile', [['done_chapters', book, ch], false])
                }
            }
        },

        resolve_all_read_chapters({state, dispatch, getters}, [book, force]){
            // Handle case of all chapters having been marked as read for a book

            // Ignore this check if doing a bulk action
            if (! force){
                // Do nothing if not all chapters read
                if (! Object.values(getters.profile.done_chapters[book]).every(done => done)){
                    return
                }
            }

            // Book finished, so mark as read and increment completions
            dispatch('set_profile', [['done_books', book], true])
            dispatch('set_profile', [['completions_books', book],
                getters.profile.completions_books[book] + 1])

            // Update last completed (and remove from last progressed)
            dispatch('set_profile', ['last_completed', book])
            const new_list = getters.profile.last_progressed.slice()
            if (new_list.includes(book)){
                new_list.splice(new_list.indexOf(book), 1)
            }
            dispatch('set_profile', ['last_progressed', new_list])

            // Reset all chapters
            dispatch('reset_chapters', book)

            // Celebrate!
            if (state.celebrations){
                celebrations.celebrate(data.num_chapters[book])
            }
        },

        // ACTIONS FOR CHAPTERS

        toggle_ch_read({getters, dispatch}, [book, chapter]){
            // Toggle the read status for a chapter (and handle any consequences)

            // Unread chapter if already read
            if (getters.profile.done_chapters[book][chapter]){
                dispatch('set_profile', [['done_chapters', book, chapter], false])
                return
            }

            // Mark chapter as read
            dispatch('set_profile', [['done_chapters', book, chapter], true])

            // Move (or add) book to beginning of last_progressed
            const new_list = getters.profile.last_progressed.slice()
            if (new_list.includes(book)){
                new_list.splice(new_list.indexOf(book), 1)
            }
            new_list.unshift(book)
            dispatch('set_profile', ['last_progressed', new_list])

            // See if book/bible complete
            dispatch('resolve_all_read_chapters', [book, false])
        },

        // ACTIONS FOR PROFILES

        set_profile({commit, state}, [key_or_keys, value]){
            // An extension of set_dict to more easily set profile values
            const keys = Array.isArray(key_or_keys) ? key_or_keys.slice() : [key_or_keys]
            commit('set_dict', [['profiles', state.profile, ...keys], value])
        },

        change_puzzle({commit, state}, profile_id){
            // Change the image used for puzzle for given profile
            const old_puzzle = state.profiles[profile_id].puzzle
            let new_puzzle = old_puzzle
            // Loop in case (though unlikely) new random puzzle is same as last
            while (new_puzzle === old_puzzle){
                new_puzzle = get_random_puzzle_id()
            }
            commit('set_dict', [['profiles', profile_id, 'puzzle'], new_puzzle])
        },

        // OTHER ACTIONS

        async change_bible_version({commit}, bible_version){
            // Change bible version and update chapter/book names (prevent if can't fetch)
            // TODO Display snack or dialog to user if fails
            const version_data = await get_version_data(bible_version)
            if (!version_data){
                return false
            }
            commit('set_dict', ['bible_version', bible_version])
            commit('set_tmp', ['book_names', version_data.book_names])
            commit('set_tmp', ['chapter_titles', version_data.chapter_titles])
            return true
        },
    },
}}


// DATABASE


async function init_db(){
    return openDB<StateDatabase>('state', 2, {
        upgrade(db, old_version, new_version, transaction){

            // Deal with previous versions
            // NOTE old_version is 0 if db doesn't exist yet
            if (old_version === 1){
                // Alpha version that had only `dict` store
                db.deleteObjectStore('dict')
            }

            // Create object stores
            // NOTE If no keyPath is given then must provide a key for every transaction
            db.createObjectStore('dict', {keyPath: 'key'})
            db.createObjectStore('profile_ids', {keyPath: 'id'})
        },
    })
}


// EXPORTED


export async function get_store(){
    // Returns an instance of the store

    // Create instance after idb setup so vuex will have access to it
    const db = await init_db()

    // Init store, and ensure integrity before returning
    const store = new Store(await get_store_options(db))
    store.dispatch('resolve_check_all')
    return store
}
