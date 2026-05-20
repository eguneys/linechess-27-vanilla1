import { make_database, type DatabaseActions } from "./idb"
import type { OpeningLineId, OpeningList, OpeningListId } from "./types"

export type LightOpeningListModel = OpeningList

export type OpeningListModel = {
    id: OpeningListId
    name: string
    lines: OpeningLineModel[]
}

export type OpeningLineModel = {
    id: string
    name: string
    pgn: string
}

export type Idb_Model_State = {
    get_opening_lists(): Promise<LightOpeningListModel[]>
    get_opening_list_by_id(id: OpeningListId): Promise<OpeningListModel | undefined>
    get_opening_line_by_id(id: OpeningLineId): Promise<OpeningLineModel | undefined>
}

export type Idb_Store = [Idb_Model_State, DatabaseActions]

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

            let res: OpeningListModel = {
                id: list.id,
                name: list.name,
                lines: lines.map(_ => _)
            }

            return res
        },
        async get_opening_line_by_id(id: OpeningLineId) {
            let line = await db_state.get_opening_line_by_id(id)

            return line
        }
    }
    
    return [state, db_actions]
}