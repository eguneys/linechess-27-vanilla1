import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { gen_id, type OpeningLine, type OpeningLineId, type OpeningList, type OpeningListId, type SingleLineMove } from './types'

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
    line_moves: {
        key: OpeningLineId
        value: SingleLineMove
        indexes: { 'by_line_id': OpeningLineId }
    }
}

export type DatabaseState = {
    get_opening_lists(): Promise<OpeningList[]>
    get_opening_list_by_id(id: OpeningListId): Promise<OpeningList | undefined>
    get_opening_lines_by_list_id(list_id: OpeningListId): Promise<OpeningLine[]>
    get_opening_line_by_id(id: OpeningLineId): Promise<OpeningLine | undefined>
    get_line_moves_by_line_id(id: OpeningLineId): Promise<SingleLineMove[]>
}

export type DatabaseActions = {
    create_opening_list(name: string): Promise<OpeningListId>
    delete_opening_list(id: OpeningListId): Promise<void>
    create_opening_line(id: OpeningListId, name: string, pgn: string): Promise<OpeningLineId>
    delete_opening_line(id: OpeningLineId): Promise<void>
    create_line_moves(moves: SingleLineMove[]): Promise<void>
    delete_line_moves(id: OpeningLineId): Promise<void>
}

export type DatabaseStore = [DatabaseState, DatabaseActions]

const VERSION = 3

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
            return db.get('opening_lines', id)
        },
        get_line_moves_by_line_id(id: OpeningLineId) {
            return db.getAllFromIndex('line_moves', 'by_line_id', id)
        }
    }

    let actions = {
        async create_opening_list(name: string) {
            let value: OpeningList = {
                id: gen_id(),
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
                id: gen_id(),
                created_at: new Date(),
                list_id,
                pgn,
                name,
            }
            return await db.put('opening_lines', value)
        },
        async delete_opening_line(id: OpeningLineId) {
            return await db.delete('opening_lines', id)
        },
        async create_line_moves(moves: SingleLineMove[]) {

            const tx = db.transaction('line_moves', 'readwrite')

            await Promise.all([
                ...moves.map(async move =>
                    await tx.store.put(move)
                ),
            ])

            await tx.done
        },
        async delete_line_moves(id: OpeningLineId) {
            const tx = db.transaction('line_moves', 'readwrite')
            for await (const cursor of tx.store.iterate(id)) {
                await cursor.delete()
            }
            await tx.done
        }
    }

    return [state, actions]
}


function create_tables(db: IDBPDatabase<LinechessDB>) {
    if (!db.objectStoreNames.contains('opening_lists')) {

        db.createObjectStore('opening_lists', {
            keyPath: 'id',
        })
    }

    if (!db.objectStoreNames.contains('opening_lines')) {
        const line_store = db.createObjectStore('opening_lines', {
            keyPath: 'id',
        })

        line_store.createIndex('by_list_id', 'list_id')
    }

    if (!db.objectStoreNames.contains('line_moves')) {
        let move_store = db.createObjectStore('line_moves', {
            keyPath: 'id'
        })
        
        move_store.createIndex('by_line_id', 'line_id')
    }



}