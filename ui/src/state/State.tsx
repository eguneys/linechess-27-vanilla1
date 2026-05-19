import { createContext, type JSX, useContext } from "solid-js"
import { make_linechess_store, type Actions, type State } from "./linechess_state"
import { make_worker, type WorkerActions, type WorkerState } from "./Worker"
import { createAsync } from "@solidjs/router"
import { make_idb_model, type Idb_Model_State } from "./idb_model"
import type { DatabaseActions } from "./idb"

export const useState = () => useContext(LinechessContext)!

const LinechessContext = createContext<LinechessStore>()

type LinechessState = {
    linechess_state: State
    worker_state: WorkerState
    db_state: Idb_Model_State | undefined
}

type LinechessActions = {
    linechess_actions: Actions
    worker_actions: WorkerActions
    db_actions: DatabaseActions | undefined
}

export type LinechessStore = [LinechessState, LinechessActions]



export const LinechessProvider = (props: { children: JSX.Element }) => {

    const get_db = createAsync(() => make_idb_model())
    const [worker_state, worker_actions] = make_worker()
    const [linechess_state, linechess_actions] = make_linechess_store(get_db)

    const state = {
        linechess_state,
        worker_state,
        get db_state() {
            return get_db()?.[0]
        }
    }

    const actions = {
        linechess_actions,
        worker_actions,
        get db_actions() {
            return get_db()?.[1]
        }
    }

    const store: LinechessStore = [state, actions]

    return <LinechessContext.Provider value={store}>
        {props.children}
    </LinechessContext.Provider>
}