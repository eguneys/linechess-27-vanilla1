import { parse_mainline_ucis_from_pgn } from "./chess_parser"
import { make_database, type DatabaseActions } from "./idb"
import { gen_id, type OpeningDiverge, type OpeningLineId, type OpeningList, type OpeningListId, type RecentMatch, type SingleLineMove } from "./types"

export type LightOpeningListModel = OpeningList

export type OpeningListModel = {
    id: OpeningListId
    name: string
    lines: LightOpeningLineModel[]
}

export type LightOpeningLineModel = {
    id: string
    name: string
    pgn: string
}

export type SingleLineMoveModel = SingleLineMove

export type OpeningLineModel = {
    id: string
    name: string
    pgn: string
    moves: SingleLineMoveModel[]
}

export type Idb_Model_State = {
    get_opening_lists(): Promise<LightOpeningListModel[]>
    get_opening_list_by_id(id: OpeningListId): Promise<OpeningListModel | undefined>
    get_opening_line_by_id(id: OpeningLineId): Promise<OpeningLineModel | undefined>
    get_opening_diverge_for_moves(moves: string): Promise<OpeningDiverge>
    get_recent_games_since_for(handle: string, since: number): Promise<RecentMatch[]>
}

export type Idb_Model_Actions = {
    db_actions: DatabaseActions
    create_opening_line(id: OpeningListId, name: string, pgn: string): Promise<OpeningLineId>
}

export type Idb_Store = [Idb_Model_State, Idb_Model_Actions]

export async function make_idb_model(): Promise<Idb_Store> {

    let [db_state, db_actions] = await make_database()

    let state: Idb_Model_State = {
        async get_opening_lists() {
            return (await db_state.get_opening_lists())
                .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        },
        async get_opening_list_by_id(id: OpeningListId) {
            let list = await db_state.get_opening_list_by_id(id)

            if (!list) {
                return undefined
            }
            let lines = await db_state.get_opening_lines_by_list_id(id)
            lines = lines.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())

            let res: OpeningListModel = {
                id: list.id,
                name: list.name,
                lines: lines.map(_ => _)
            }

            return res
        },
        async get_opening_line_by_id(id: OpeningLineId) {
            let line = await db_state.get_opening_line_by_id(id)

            if (!line) {
                return undefined
            }

            let moves = await db_state.get_line_moves_by_line_id(id)

            moves = moves.sort((a, b) => a.ply - b.ply)

            return {
                id: line.id,
                name: line.name,
                pgn: line.pgn,
                moves
            }
        },
        async get_opening_diverge_for_moves(moves: string) {
            let res!: OpeningDiverge

            return res
        },
        async get_recent_games_since_for(handle: string, since: number): Promise<RecentMatch[]> {
            let res: RecentMatch[] = []

            return res
        }
    }

    let actions = {
        db_actions,
        async create_opening_line(list_id: OpeningListId, name: string, pgn: string) {

            let sans = parse_mainline_ucis_from_pgn(pgn)

            if (sans.length < 3) {
                throw new InvalidPGNException()
            }
            let line_id = await db_actions.create_opening_line(list_id, name, pgn)

            let moves = sans.map(({uci, san}, index) => {
                return {
                    id: gen_id(),
                    line_id,
                    ply: index + 1,
                    uci,
                    san
                }
            })
            await db_actions.create_line_moves(moves)
            return line_id
        }
    }
    
    return [state, actions]
}

class InvalidPGNException extends Error {}