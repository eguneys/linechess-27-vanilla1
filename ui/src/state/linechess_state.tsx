import { createStore } from "solid-js/store"
import { makePersisted } from "@solid-primitives/storage"
import type { OpeningLineId } from "./types"
import { createAsync, type AccessorWithLatest } from "@solidjs/router"
import type { Idb_Store, LightOpeningListModel, OpeningListModel } from "./idb_model"

export type DashboardTab = 'dashboard' | 'repertoire'


export type State = {
    dashboard_tab: DashboardTab
    selected_opening_line_id: OpeningLineId | undefined
    selected_opening_line: OpeningListModel | undefined
    opening_lists: LightOpeningListModel[]
}

export type Actions = {
    set_dashboard_tab: (tab: DashboardTab) => void
}

export type LinechessStore = [State, Actions]


type LinechessPersistedStore = {
    dashboard_tab: DashboardTab
    selected_opening_line_id: OpeningLineId | undefined
}

export function make_linechess_store(get_db: AccessorWithLatest<Idb_Store | undefined>): LinechessStore {

    let [store, set_store] = makePersisted(createStore<LinechessPersistedStore>({
        dashboard_tab: 'dashboard',
        selected_opening_line_id: undefined,
    }), { name: '.linechess.store.v1'})

    const selected_opening_line = createAsync(async () => {
        if (!store.selected_opening_line_id) {
            return undefined
        }

        return await get_db()?.[0].get_opening_list_by_id(store.selected_opening_line_id)
    })

    const opening_lists = createAsync(async () => {
        return await get_db()?.[0].get_opening_lists()
    })

    let state = {
        get dashboard_tab() {
            return store.dashboard_tab
        },
        get selected_opening_line_id() {
            return store.selected_opening_line_id
        },
        get selected_opening_line() {
            return selected_opening_line()
        },
        get opening_lists() {
            return opening_lists() ?? []
        }
    }

    let actions = {
        set_dashboard_tab(tab: DashboardTab) {
            set_store({
                dashboard_tab: tab
            })
        },
    }

    return [state, actions]
}