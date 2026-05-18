import { createSignal } from 'solid-js'
import Worker from './worker2?worker'

export type WorkerActions = {
}

export type WorkerState = {

}

export type WorkerStore = [WorkerState, WorkerActions]

export function make_worker(): WorkerStore {
    let worker = new Worker()
    worker.onmessage = (e) => {
        if (e.data === 'ready') {
            set_isReady(true)
        }
    }

    let [isReady, set_isReady] = createSignal(false)

    let state = {
        get is_ready() {
            return isReady()
        },
    }

    let actions = {
    }


    return [state, actions]
}