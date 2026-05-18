import { createContext, type JSX, useContext } from "solid-js"
import { make_linechess_store, type Actions, type State } from "./linechess_state"
import { make_worker, type WorkerActions, type WorkerState } from "./Worker"

export const useState = () => useContext(LinechessContext)!

const LinechessContext = createContext<LinechessStore>()

type LinechessState = {
    linechess_state: State
    worker_state: WorkerState
}

type LinechessActions = {
    linechess_actions: Actions
    worker_actions: WorkerActions
}

export type LinechessStore = [LinechessState, LinechessActions]



export const LinechessProvider = (props: { children: JSX.Element }) => {

    const [worker_state, worker_actions] = make_worker()
    const [linechess_state, linechess_actions] = make_linechess_store(worker_state, worker_actions)


    const state = {
        linechess_state,
        worker_state
    }

    const actions = {
        linechess_actions,
        worker_actions
    }

    const store: LinechessStore = [state, actions]

    return <LinechessContext.Provider value={store}>
        {props.children}
    </LinechessContext.Provider>
}