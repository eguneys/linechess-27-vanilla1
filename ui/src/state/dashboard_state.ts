import { makePersisted } from "@solid-primitives/storage"
import type { AllowedSpeed, LichessSearchHandle, LoggedInUser } from "./types"
import { createStore, produce } from "solid-js/store"
import type { Idb_Store } from "./idb_model"
import { createAsync, type AccessorWithLatest } from "@solidjs/router"
import { make_lichess_api_with_cache } from "./lichess_api_with_cache"
import { Default_O_params, type Overall_Params } from "./fitness2"
import { createMemo } from "solid-js"

export type DashboardState = {
    logged_in_user: LoggedInUser | undefined
    search_handle_name: string
    search_handle: LichessSearchHandle | undefined
    overall_params: Overall_Params
}

export type ParamA = AllowedSpeed | 'general'
export type ParamB = 'alpha' | 'gamma' | 'lambda' | 'g_target' | 'T_ratio'

export type DashboardActions = {
    set_search_handle(name: string): void
    check_games_now(): void
    set_overall_params(param_a: ParamA, param_b: ParamB, value: number): void
}

export type DashboardStore = [DashboardState, DashboardActions]

export type DashboardPersistedStore = {
    logged_in_user: LoggedInUser | undefined
    search_handle: string
    o_params: Overall_Params
}


export function make_dashboard(get_db: AccessorWithLatest<Idb_Store | undefined>): DashboardStore {

    let [store, set_store] = makePersisted(createStore<DashboardPersistedStore>({
        logged_in_user: undefined,
        search_handle: 'ediz_gurel',
        o_params: Default_O_params
    }), { name: '.linechess.dashboardstore.v2'})


    const get_o_params = createMemo(() => store.o_params)

    const [, { set_search_handle, check_games_now, reconfigure_params }] = make_lichess_api_with_cache(get_db, get_o_params)

    const search_handle = createAsync(() => set_search_handle(store.search_handle))

    let state = {
        get overall_params() {
            return store.o_params
        },
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
        },
        check_games_now() {
            check_games_now()
        },
        set_overall_params(a: ParamA, b: ParamB, value: number) {
            if (a === 'general') {
            } else {

                if (b === 'T_ratio') {
                    set_store(produce(store => {
                        if (a === 'bullet') {
                            store.o_params.Tb = value
                        }
                        if (a === 'blitz') {
                            store.o_params.Tz = value
                        }
                        if (a === 'rapid') {
                            store.o_params.Tr = value
                        }
                        if (a === 'classical') {
                            store.o_params.Tc = value
                        }
                    }))
                }

                if (b === 'alpha') {
                    set_store(produce(store => {
                        if (a === 'bullet') {
                            store.o_params.Pb.alpha = value
                        }
                        if (a === 'blitz') {
                            store.o_params.Pz.alpha = value
                        }
                        if (a === 'rapid') {
                            store.o_params.Pr.alpha = value
                        }
                        if (a === 'classical') {
                            store.o_params.Pc.alpha = value
                        }
                    }))
                }

                if (b === 'g_target') {
                    set_store(produce(store => {
                        if (a === 'bullet') {
                            store.o_params.Pb.Gtarget = value
                        }
                        if (a === 'blitz') {
                            store.o_params.Pz.Gtarget = value
                        }
                        if (a === 'rapid') {
                            store.o_params.Pr.Gtarget = value
                        }
                        if (a === 'classical') {
                            store.o_params.Pc.Gtarget = value
                        }
                    }))
                }

                if (b === 'gamma') {
                    set_store(produce(store => {
                        if (a === 'bullet') {
                            store.o_params.Pb.cc.Gamma_you = value
                        }
                        if (a === 'blitz') {
                            store.o_params.Pz.cc.Gamma_you = value
                        }
                        if (a === 'rapid') {
                            store.o_params.Pr.cc.Gamma_you = value
                        }
                        if (a === 'classical') {
                            store.o_params.Pc.cc.Gamma_you = value
                        }
                    }))
                }


                if (b === 'lambda') {
                    set_store(produce(store => {
                        if (a === 'bullet') {
                            store.o_params.Pb.cc.Lambda_opp = value
                        }
                        if (a === 'blitz') {
                            store.o_params.Pz.cc.Lambda_opp = value
                        }
                        if (a === 'rapid') {
                            store.o_params.Pr.cc.Lambda_opp = value
                        }
                        if (a === 'classical') {
                            store.o_params.Pc.cc.Lambda_opp = value
                        }
                    }))
                }
            }
            reconfigure_params()
        }
    }

    return [state, actions]
}