import { makePersisted } from "@solid-primitives/storage"
import type { LichessSearchHandle, LoggedInUser } from "./types"
import { createStore } from "solid-js/store"
import type { Idb_Store } from "./idb_model"
import { createAsync, type AccessorWithLatest } from "@solidjs/router"
import { make_lichess_api_with_cache } from "./lichess_api_with_cache"

export type DashboardState = {
    logged_in_user: LoggedInUser | undefined
    search_handle_name: string
    search_handle: LichessSearchHandle | undefined
}

export type DashboardActions = {
    set_search_handle(name: string): void
}

export type DashboardStore = [DashboardState, DashboardActions]

export type DashboardPersistedStore = {
    logged_in_user: LoggedInUser | undefined
    search_handle: string
}


export function make_dashboard(get_db: AccessorWithLatest<Idb_Store | undefined>): DashboardStore {

    let [store, set_store] = makePersisted(createStore<DashboardPersistedStore>({
        logged_in_user: undefined,
        search_handle: ''
    }), { name: '.linechess.dashboardstore.v1'})

    const [, { set_search_handle }] = make_lichess_api_with_cache(get_db)

    const search_handle = createAsync(() => set_search_handle(store.search_handle))

    let state = {
        get logged_in_user() {
            return store.logged_in_user
        },
        get search_handle_name() {
            return store.search_handle
        },
        get search_handle() {
            return search_handle()
        },
    }

    let actions = {
        set_search_handle(name: string) {
            set_store('search_handle', name)
        }
    }

    return [state, actions]
}