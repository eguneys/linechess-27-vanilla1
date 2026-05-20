import type { SAN, UCI } from "./chess_parser"

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

