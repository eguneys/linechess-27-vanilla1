import { createContext, type JSX, useContext } from "solid-js"
import { make_linechess_store, type Actions, type State } from "./linechess_state"
import { createAsync } from "@solidjs/router"
import { make_idb_model, type Idb_Model_Actions, type Idb_Model_State } from "./idb_model"
import { make_dashboard, type DashboardActions, type DashboardState } from "./dashboard_state"

export const useState = () => useContext(LinechessContext)!

const LinechessContext = createContext<LinechessStore>()

type LinechessState = {
    linechess_state: State
    dashboard_state: DashboardState
    db_state: Idb_Model_State | undefined
}

type LinechessActions = {
    linechess_actions: Actions
    dashboard_actions: DashboardActions
    db_actions: Idb_Model_Actions | undefined
}

export type LinechessStore = [LinechessState, LinechessActions]



export const LinechessProvider = (props: { children: JSX.Element }) => {

    const get_db = createAsync(() => make_idb_model())
    const [dashboard_state, dashboard_actions] = make_dashboard(get_db)
    const [linechess_state, linechess_actions] = make_linechess_store(get_db)

    const state = {
        linechess_state,
        dashboard_state,
        get db_state() {
            return get_db()?.[0]
        }
    }

    const actions = {
        linechess_actions,
        dashboard_actions,
        get db_actions() {
            return get_db()?.[1]
        }
    }

    const store: LinechessStore = [state, actions]

    return <LinechessContext.Provider value={store}>
        {props.children}
    </LinechessContext.Provider>
}