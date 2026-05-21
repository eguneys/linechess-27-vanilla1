import type { AccessorWithLatest } from "@solidjs/router"
import type { Idb_Store } from "./idb_model"
import { is_allowed_speed, type AllowedSpeed, type LichessSearchHandle, type RecentMatch } from "./types"
import { batch, createMemo, createSignal } from "solid-js"
import { create_lichess_agent, type exportGameResponse } from "./lichess_agent"

export type LichessApiState = {
    most_recent_handle: LichessSearchHandle | undefined
    fetch_most_recent_username: string
    sync_on_pushed_more_recent_games: boolean
}

export type LichessApiActions = {
    set_search_handle(handle: string): Promise<void>
}

export type LichessApiStore = [LichessApiState, LichessApiActions]

export function make_lichess_api_with_cache(get_db: AccessorWithLatest<Idb_Store | undefined>): LichessApiStore {

    const [sync_on_pushed_more_recent_games, set_sync_on_pushed_more_recent_games] = createSignal(false, { equals: false })
    const [$lichess_cache, $set_lichess_cache] = make_lichess_cache_agent()

    const [handle, set_handle] = createSignal<LichessSearchHandle | undefined>(undefined)

    const most_recent_username_memo = createMemo(() => handle()?.username ?? '')

    let state: LichessApiState = {
        get sync_on_pushed_more_recent_games() {
            return sync_on_pushed_more_recent_games()
        },
        get fetch_most_recent_username() {
            return most_recent_username_memo()
        },
        get most_recent_handle() {
            let username = $lichess_cache.retrieve_most_recent_handle

            if (!username) {
                $set_lichess_cache.break_fill_handle()
                set_handle(undefined)
                return undefined
            }

            let h = handle()

            let new_handle: LichessSearchHandle = {
                username,
                fitness_score: 0,
                nb_played_score: 0,
                nb_bullet: 0,
                nb_blitz: 0,
                nb_rapid: 0,
                nb_classical: 0,
                recent_matches: [],
            }



            if (h === undefined) {
                set_handle(new_handle)
            } else if (h.username !== username) {
                set_handle(new_handle)
                //$set_lichess_cache.break_fill_handle()
            }

            let db = get_db()

            if (db !== undefined) {
                let games_to_add = $lichess_cache.recent_games_to_add

                if (games_to_add.length > 0) {
                    batch(() => {
                        $set_lichess_cache.reset_recent_games_to_add()
                        set_handle(add_recent_games(db, handle()!, games_to_add))
                        set_sync_on_pushed_more_recent_games(true)
                    })
                }
            }

            return handle()
        }
    }

    let actions = {
        async set_search_handle(handle: string) {
            let db = get_db()
            if (!db) {
                return
            }

            $set_lichess_cache.begin_fill_handle(db, handle)
        }
    }

    return [state, actions]
}

export type LichessCacheAgentState = {
    recent_games_to_add: RecentMatch[]
    retrieve_most_recent_handle: string
}

export type LichessCacheAgentActions = {
    begin_fill_handle(db: Idb_Store, handle: string): Promise<void>
    break_fill_handle(): Promise<void>
    reset_recent_games_to_add(): void
}

export type LichessCacheAgentStore = [LichessCacheAgentState, LichessCacheAgentActions]

function make_lichess_cache_agent(): LichessCacheAgentStore {

    let $agent = create_lichess_agent()

    const [most_recent_handle, set_most_recent_handle] = createSignal('', { equals: false })

    let [recent_matches, set_recent_matches] = createSignal<RecentMatch[]>([])
    let batched_games: RecentMatch[]
    let cancel_running_stream: () => void = () => {}

    function flushGames(games: RecentMatch[]) {
        if (games.length > 0) {
            set_recent_matches(prev => [...prev, ...games])
        }
    }

    let state = {
        get recent_games_to_add() {
            let res = recent_matches()
            return res
        },
        get retrieve_most_recent_handle() {
            return most_recent_handle()
        }
    }

    let actions = {
        reset_recent_games_to_add() {
            set_recent_matches([])
            batched_games = []
        },
        async begin_fill_handle(db: Idb_Store, handle: string) {
            cancel_running_stream()
            batched_games = []

            if (handle.length < 3) {
                set_most_recent_handle('')
                return
            }

            let username = await $agent.fetch_username(handle)

            if (!username) {
                set_most_recent_handle('')
                return
            }

            set_most_recent_handle(username)

            let games = await db[0].get_recent_games_since_for(handle, YesterdayMs())

            batched_games = games

            let since = batched_games[0]?.game_created_at ?? YesterdayMs()

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
            }
        },
        async break_fill_handle() {
            cancel_running_stream()
            batched_games = []
        }
    }

    return [state, actions]
}


function add_recent_games(db: Idb_Store, handle: LichessSearchHandle, games_to_add: RecentMatch[]): LichessSearchHandle {

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
    let new_recent_matches = [...games_to_add, ...recent_matches]

    let res: LichessSearchHandle = {
        fitness_score: new_fitness_score,
        nb_played_score: new_nb_played_score,
        nb_bullet: new_nb_bullet,
        nb_blitz: new_nb_blitz,
        nb_rapid: new_nb_rapid,
        nb_classical: new_nb_classical,
        username,
        recent_matches: new_recent_matches
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