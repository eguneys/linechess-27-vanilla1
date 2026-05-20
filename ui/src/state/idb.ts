import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { OpeningLine, OpeningLineId, OpeningList, OpeningListId } from './types'

interface LinechessDB extends DBSchema {
    opening_lists: {
        key: OpeningListId
        value: OpeningList
    }
    opening_lines: {
        key: OpeningLineId
        value: OpeningLine
        indexes: { 'by_list_id': OpeningListId }
    }
}

export type DatabaseState = {
    get_opening_lists(): Promise<OpeningList[]>
    get_opening_list_by_id(id: OpeningListId): Promise<OpeningList | undefined>
    get_opening_lines_by_list_id(list_id: OpeningListId): Promise<OpeningLine[]>
    get_opening_line_by_id(id: OpeningLineId): Promise<OpeningLine | undefined>
}

export type DatabaseActions = {
    create_opening_list(name: string): Promise<OpeningListId>
    delete_opening_list(id: OpeningListId): Promise<void>
    create_opening_line(id: OpeningListId, name: string, pgn: string): Promise<OpeningLineId>
}

export type DatabaseStore = [DatabaseState, DatabaseActions]

const VERSION = 1

export async function make_database(): Promise<DatabaseStore> {

    const db = await openDB<LinechessDB>('linechess-db', VERSION, {
        upgrade(db) {
            create_tables(db)
        }
    })


    let state = {
        get_opening_lists() {
            return db.getAll('opening_lists')
        },
        get_opening_list_by_id(id: OpeningListId) {
            return db.get('opening_lists', id)
        },
        get_opening_lines_by_list_id(id: OpeningListId) {
            return db.getAllFromIndex('opening_lines', 'by_list_id', id)
        },
        get_opening_line_by_id(id: OpeningLineId) {
            return db.getFromIndex('opening_lines', 'by_list_id', id)
        }
    }

    let actions = {
        async create_opening_list(name: string) {
            let value: OpeningList = {
                id: crypto.randomUUID(),
                name,
                created_at: new Date()
            }
            return await db.put('opening_lists', value)
        },
        async delete_opening_list(id: OpeningListId) {
            return await db.delete('opening_lists', id)
        },
        async create_opening_line(list_id: OpeningListId, name: string, pgn: string) {
            let value: OpeningLine = {
                id: crypto.randomUUID(),
                created_at: new Date(),
                list_id,
                pgn,
                name,
            }
            return await db.put('opening_lines', value)
        },
    }

    return [state, actions]
}


function create_tables(db: IDBPDatabase<LinechessDB>) {
    db.createObjectStore('opening_lists', {
        keyPath: 'id',
    })

    const line_store = db.createObjectStore('opening_lines', {
        keyPath: 'id',
    })


    line_store.createIndex('by_list_id', 'list_id')
}