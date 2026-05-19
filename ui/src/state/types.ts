export type OpeningListId = string

export type OpeningList = {
    id: OpeningListId
    name: string
}


export type OpeningLineId = string
export type OpeningLine = {
    id: OpeningLineId
    list_id: OpeningListId
    name: string
    pgn: string
}