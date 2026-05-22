import { createStore } from "solid-js/store"
import { makePersisted } from "@solid-primitives/storage"
import type { OpeningLineId, OpeningListId } from "./types"
import { createAsync, type AccessorWithLatest } from "@solidjs/router"
import type { Idb_Store, LightOpeningListModel, OpeningLineModel, OpeningListModel } from "./idb_model"
import { createSignal } from "solid-js"

export type DashboardTab = 'dashboard' | 'repertoire'


export type State = {
    dashboard_tab: DashboardTab
    selected_opening_list_id: OpeningListId | undefined
    selected_opening_list: OpeningListModel | undefined
    opening_lists: LightOpeningListModel[]
    is_create_new_opening_modal_open: boolean
    is_add_new_line_modal_open: boolean
    selected_opening_line_id: OpeningLineId | undefined
    selected_opening_line: OpeningLineModel | undefined
    add_new_line_pgn: string
}

export type Actions = {
    set_dashboard_tab: (tab: DashboardTab) => void
    set_open_create_new_opening: (v: boolean) => void
    set_open_add_new_line: (v: boolean, pgn?: string) => void
    create_opening_list: (name: string) => Promise<OpeningListId | undefined>
    select_opening_list: (id: OpeningListId) => void
    delete_opening_list: (id: OpeningListId) => void
    select_opening_line: (id: OpeningLineId) => void
    create_opening_line: (name: string, pgn: string) => Promise<OpeningLineId | undefined>
    delete_selected_line: () => Promise<void>
}

export type LinechessStore = [State, Actions]


type LinechessPersistedStore = {
    dashboard_tab: DashboardTab
    selected_opening_list_id: OpeningListId | undefined
    selected_opening_line_id: OpeningLineId | undefined
    is_create_new_opening_modal_open: boolean
    is_add_new_line_modal_open: boolean
}

export function make_linechess_store(get_db: AccessorWithLatest<Idb_Store | undefined>): LinechessStore {

    let [temp_store, set_temp_store] = createStore({
        add_new_line_pgn: ''
    })

    let [store, set_store] = makePersisted(createStore<LinechessPersistedStore>({
        is_create_new_opening_modal_open: false,
        is_add_new_line_modal_open: false,
        dashboard_tab: 'dashboard',
        selected_opening_list_id: undefined,
        selected_opening_line_id: undefined,
    }), { name: '.linechess.store.v1'})

    const [fetch_selected_opening_list, set_fetch_selected_opening_list] = createSignal(false, { equals: false })
    const selected_opening_list = createAsync(async () => {
        fetch_selected_opening_list()
        if (!store.selected_opening_list_id) {
            return undefined
        }

        return await get_db()?.[0].get_opening_list_by_id(store.selected_opening_list_id)
    })


    const selected_opening_line = createAsync(async () => {
        if (!store.selected_opening_line_id) {
            return undefined
        }

        return await get_db()?.[0].get_opening_line_by_id(store.selected_opening_line_id)
    })



    const [fetch_lists, set_fetch_lists] = createSignal(false, { equals: false })
    const opening_lists = createAsync(async () => {
        fetch_lists()
        return await get_db()?.[0].get_opening_lists()
    })

    let state = {
        get add_new_line_pgn() {
            return temp_store.add_new_line_pgn
        },
        get dashboard_tab() {
            return store.dashboard_tab
        },
        get selected_opening_list_id() {
            return store.selected_opening_list_id
        },
        get selected_opening_list() {
            return selected_opening_list()
        },
        get opening_lists() {
            return opening_lists() ?? []
        },
        get is_create_new_opening_modal_open() {
            return store.is_create_new_opening_modal_open
        },
        get is_add_new_line_modal_open() {
            return store.is_add_new_line_modal_open
        },
        get selected_opening_line_id() {
            return store.selected_opening_line_id
        },
        get selected_opening_line() {
            return selected_opening_line()
        },
    }

    let actions = {
        set_dashboard_tab(tab: DashboardTab) {
            set_store({
                dashboard_tab: tab
            })
        },
        set_open_create_new_opening(v: boolean) {
            set_store({
                is_create_new_opening_modal_open: v
            })
        },
        set_open_add_new_line(v: boolean, pgn?: string) {
            set_store({
                is_add_new_line_modal_open: v
            })
            if (pgn) {
                set_temp_store({
                    add_new_line_pgn: pgn
                })
            }
        },
        async create_opening_list(name: string) {
            let res = await get_db()?.[1].db_actions.create_opening_list(name)

            set_fetch_lists(true)
            return res
        },
        select_opening_list(id: OpeningListId) {
            set_store({
                selected_opening_list_id: id
            })
        },
        async delete_opening_list(id: OpeningListId) {

            await get_db()?.[1].db_actions.delete_opening_list(id)


            set_fetch_lists(true)
            let next_id = opening_lists()?.find(_ => _.id !== id)?.id
            set_store({
                selected_opening_list_id: next_id
            })
        },
        select_opening_line(id: OpeningLineId) {
            set_store({
                selected_opening_line_id: id
            })
        },
        async create_opening_line(name: string, pgn: string) {
            let selected_opening_list_id = state.selected_opening_list_id
            if (!selected_opening_list_id) {
                return undefined
            }

            let res = await get_db()?.[1].create_opening_line(selected_opening_list_id, name, pgn)

            set_fetch_selected_opening_list(true)
            return res
        },
        async delete_selected_line() {
            let id = state.selected_opening_line_id
            if (!id) {
                return
            }

            await get_db()?.[1].db_actions.delete_opening_line(id)


            set_fetch_selected_opening_list(true)
            let next_id = selected_opening_list()?.lines.find(_ => _.id !== id)?.id
            set_store({
                selected_opening_line_id: next_id
            })
        },
    }

    return [state, actions]
}
