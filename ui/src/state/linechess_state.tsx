import { createStore } from "solid-js/store"
import type { WorkerActions, WorkerState } from "./Worker"
import { makePersisted } from "@solid-primitives/storage"

export type DashboardTab = 'dashboard' | 'repertoire'

export type State = {
    dashboard_tab: DashboardTab
}

export type Actions = {
    set_dashboard_tab: (tab: DashboardTab) => void
}

export type LinechessStore = [State, Actions]


type LinechessPersistedStore = {
    dashboard_tab: DashboardTab
}

export function make_linechess_store(_worker_state: WorkerState, _worker_actions: WorkerActions): LinechessStore {

    let [store, set_store] = makePersisted(createStore<LinechessPersistedStore>({
        dashboard_tab: 'dashboard'
    }), { name: '.linechess.store.v1'})

    let state = {
        get dashboard_tab() {
            return store.dashboard_tab
        },
    }

    let actions = {
        set_dashboard_tab(tab: DashboardTab) {
            set_store({
                dashboard_tab: tab
            })
        }
    }

    return [state, actions]
}