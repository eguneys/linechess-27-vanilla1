import type { Color } from "chessops"
import type { SAN, UCI } from "./chess_parser"
import type {  OpeningLineModelWithList } from "./idb_model"

export type OpeningListId = string

export type OpeningList = {
    id: OpeningListId
    name: string
    created_at: Date
}


export type OpeningLineId = string
export type OpeningLine = {
    id: OpeningLineId
    list_id: OpeningListId
    name: string
    pgn: string
    created_at: Date
}


export type SingleLineMoveId = string
export type SingleLineMove = {
    id: SingleLineMoveId
    line_id: OpeningLineId
    ply: number
    uci: UCI
    san: SAN
}

export function gen_id() {
    return Math.random().toString(16).slice(2, 10)
}




export type LoggedInUser = {
    username: string
    token: string
}

export type AllowedSpeed = 'bullet' | 'blitz' | 'rapid' | 'classical'
export let Allowed_speeds: AllowedSpeed[] = ['bullet', 'blitz', 'rapid', 'classical']

export function is_allowed_speed(_: string): _ is AllowedSpeed {
    return Allowed_speeds.includes(_ as AllowedSpeed)
}

export type OpeningDiverge = {
    after_nb_moves: number
    after_ply: number
    after_move: string
    diverge_move: string
    diverge_ply: number
    did_you_diverge: boolean
    most_matched_opening: OpeningLineModelWithList
    diverge_at_ply: number
}

export type OpeningInfo = {
    diverge?: OpeningDiverge
    moves: string[]
}

export type RecentMatch = {
    opening: OpeningInfo
    game_created_at: number
    game_last_move_at: number
    is_rated: boolean
    lichess_game_id: string
    white: string
    black: string
    winner: Color
    you: Color
    did_you_win: boolean
    did_you_draw: boolean
    speed: AllowedSpeed
    perf: string
}


export type LichessSearchHandle = {
    handle: string
    username: string
    fitness_score: number
    nb_played_score: number
    nb_bullet: number
    nb_blitz: number
    nb_rapid: number
    nb_classical: number
    recent_matches: RecentMatch[]
    is_fetching_recent_games: boolean
    last_checked: number
}