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


export type SingleLineMove = {
    id: OpeningLineId
    ply: number
    uci: UCI
    san: SAN
}