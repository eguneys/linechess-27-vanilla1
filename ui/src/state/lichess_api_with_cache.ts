import type { AccessorWithLatest } from "@solidjs/router"
import type { Idb_Store } from "./idb_model"
import { is_allowed_speed, type AllowedSpeed, type LichessSearchHandle, type RecentMatch } from "./types"
import { create_lichess_agent, type exportGameResponse } from "./lichess_agent"
import { createStore, produce } from "solid-js/store"

export type LichessApiState = {
}

export type LichessApiActions = {
    set_search_handle(handle: string): Promise<LichessSearchHandle | undefined>
}

export type LichessApiStore = [LichessApiState, LichessApiActions]

export function make_lichess_api_with_cache(get_db: AccessorWithLatest<Idb_Store | undefined>): LichessApiStore {

    const [, $set_lichess_cache] = make_lichess_cache_agent(get_db)


    let actions = {
        async set_search_handle(handle: string) {
            return $set_lichess_cache.begin_fill_handle(handle)
        }
    }

    return [{}, actions]
}

export type LichessSearchHandleState = {
    lichess_search_handle: LichessSearchHandle | undefined
}
export type LichessSearchHandleActions = {
    set_username(search_handle?: LichessSearchHandle): void
    add_recent_games(games: RecentMatch[]): Promise<void>
    finish_games(): void
}

export type LichessSearchHandleComputer = [LichessSearchHandleState, LichessSearchHandleActions]

export function make_lichess_search_handle_computer(get_db: AccessorWithLatest<Idb_Store | undefined>): LichessSearchHandleComputer {

    let [store, set_store] = createStore<LichessSearchHandle>({
        username: '',
        fitness_score: 0,
        nb_played_score: 0,
        nb_bullet: 0,
        nb_blitz: 0,
        nb_rapid: 0,
        nb_classical: 0,
        recent_matches: [],
        is_fetching_recent_games: false
    })

    let state = {
        get lichess_search_handle() {
            return store?.username === '' ? undefined : store
        }
    }
    let actions = {
        finish_games() {
            set_store('recent_matches_done_since', Date.now())
            set_store('is_fetching_recent_games', false)
            let db = get_db()

            if (!db) {
                return
            }

            db[1].set_recent_search_handle(store)

        },
        async add_recent_games(games: RecentMatch[]) {
            let db = get_db()

            if (!db) {
                return
            }

            let new_store = await add_recent_games(db, store, games)

            set_store(produce(store => {
                store.fitness_score = new_store.fitness_score
                store.nb_blitz = new_store.nb_blitz
                store.nb_bullet = new_store.nb_bullet
                store.nb_rapid = new_store.nb_rapid
                store.nb_classical = new_store.nb_classical
                store.recent_matches = new_store.recent_matches
            }))

        },
        set_username(new_store: LichessSearchHandle) {
            set_store(produce(store => {
                store.username = new_store.username
                store.fitness_score = new_store.fitness_score
                store.nb_blitz = new_store.nb_blitz
                store.nb_bullet = new_store.nb_bullet
                store.nb_rapid = new_store.nb_rapid
                store.nb_classical = new_store.nb_classical
                store.recent_matches = new_store.recent_matches
                store.is_fetching_recent_games = new_store.is_fetching_recent_games
            }))
        }
    }
    return [state, actions]
}

export type LichessCacheAgentState = {}

export type LichessCacheAgentActions = {
    begin_fill_handle(handle: string): Promise<LichessSearchHandle | undefined>
}

export type LichessCacheAgentStore = [LichessCacheAgentState, LichessCacheAgentActions]

function make_lichess_cache_agent(get_db: AccessorWithLatest<Idb_Store | undefined>): LichessCacheAgentStore {

    let $agent = create_lichess_agent()

    const [pc, set_pc] = make_lichess_search_handle_computer(get_db)

    let batched_games: RecentMatch[]
    let cancel_running_stream: () => void = () => {}

    async function flushGames(games: RecentMatch[]) {
        if (games.length > 0) {
            return await set_pc.add_recent_games(games)
        }
    }

    const break_fill_handle = () => {
        cancel_running_stream()
        batched_games = []
    }

    let actions = {
        async begin_fill_handle(handle: string) {

            let db = get_db()

            if (!db) {
                return undefined
            }

            break_fill_handle()

            if (handle.length < 3) {
                set_pc.set_username(undefined)
                return
            }

            let username = await $agent.fetch_username(handle)

            if (!username) {
                set_pc.set_username(undefined)
                return
            }

            let search_handle = await db[0].get_recent_search_handle_by_username_since(handle, YesterdayMs())

            if (!search_handle) {
                search_handle = {
                    fitness_score: 0,
                    nb_played_score: 0,
                    nb_bullet: 0,
                    nb_blitz: 0,
                    nb_rapid: 0,
                    nb_classical: 0,
                    username,
                    recent_matches: [],
                    recent_matches_done_since: undefined,
                    is_fetching_recent_games: true
                }
            }

            set_pc.set_username(search_handle)

            let since = search_handle.recent_matches_done_since ?? YesterdayMs()

            let { cancel, stream } = $agent.fetch_games(username, since)

            cancel_running_stream = cancel

            let lastFlush = performance.now()

            for await (const game of stream) {
                let b_game = await map_export_game_to_recent_match(db, game)
                if (b_game !== undefined) {
                    batched_games.push(b_game)
                }

                const now = performance.now()

                if (
                    batched_games.length > 0 &&
                    now - lastFlush >= 3_00
                ) {
                    flushGames(batched_games)

                    batched_games = []
                    lastFlush = now
                }
            }

            // flush remaining
            if (batched_games.length > 0) {
                flushGames(batched_games)
                batched_games = []
                set_pc.finish_games()
            }

            return pc.lichess_search_handle
        }
    }

    return [{}, actions]
}


export async function add_recent_games(db: Idb_Store, handle: LichessSearchHandle, games_to_add: RecentMatch[]): Promise<LichessSearchHandle> {

    const add_fitness_score = (_db: Idb_Store, _fitness_score: number, _games_to_add: RecentMatch[]) => {
        return 0
    }
    const add_nb_played_score = (_nb_played_score: number, _games_to_add: RecentMatch[]) => {
        return 0
    }
    const add_nb_speed = (nb_bullet: number, games_to_add: RecentMatch[], speed: AllowedSpeed) => {
        return nb_bullet + games_to_add.filter(_ => _.speed === speed).length
    }


    let fitness_score = handle.fitness_score
    let nb_played_score = handle.nb_played_score
    let nb_blitz = handle.nb_blitz
    let nb_bullet = handle.nb_bullet
    let nb_rapid = handle.nb_rapid
    let nb_classical = handle.nb_classical
    let username = handle.username
    let recent_matches = handle.recent_matches

    let new_fitness_score = add_fitness_score(db, fitness_score, games_to_add)
    let new_nb_played_score = add_nb_played_score(nb_played_score, games_to_add)
    let new_nb_bullet = add_nb_speed(nb_bullet, games_to_add, 'bullet')
    let new_nb_blitz = add_nb_speed(nb_blitz, games_to_add, 'blitz')
    let new_nb_rapid = add_nb_speed(nb_rapid, games_to_add, 'rapid')
    let new_nb_classical = add_nb_speed(nb_classical, games_to_add, 'classical')
    let new_recent_matches = [...recent_matches, ...games_to_add]

    let res: LichessSearchHandle = {
        fitness_score: new_fitness_score,
        nb_played_score: new_nb_played_score,
        nb_bullet: new_nb_bullet,
        nb_blitz: new_nb_blitz,
        nb_rapid: new_nb_rapid,
        nb_classical: new_nb_classical,
        username,
        recent_matches: new_recent_matches,
        recent_matches_done_since: handle.recent_matches_done_since,
        is_fetching_recent_games: true
    }

    return res
}


async function map_export_game_to_recent_match(db: Idb_Store, game: exportGameResponse): Promise<RecentMatch | undefined> {

    let is_rated = game.rated
    let game_created_at = game.createdAt
    let lichess_game_id = game.id
    let initial_fen = game.initialFen
    let moves = game.moves
    let perf = game.perf
    let black = game.players.black.name
    let white = game.players.white.name
    let winner = game.winner
    let speed = game.speed
    let variant = game.variant
    //let status = game.status

    if (variant !== 'standard') {
        return undefined
    }

    if (!is_allowed_speed(speed)) {
        return undefined
    }

    if (moves.split(' ').length < 3) {
        return undefined
    }

    if (initial_fen !== undefined) {
        return undefined
    }

    let opening_diverge = await db[0].get_opening_diverge_for_moves(moves)

    let res: RecentMatch = {
        opening_diverge,
        perf,
        game_created_at,
        is_rated,
        lichess_game_id,
        white,
        black,
        winner,
        speed
    }

    return res
}

// (60 * 60 * 24 = 86400 seconds in a day) * 1000 Ms
export const YesterdayMs = () => (Math.floor(Date.now() / 1000) - (60 * 60 * 24)) * 1000