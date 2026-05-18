import { PositionManager, usage, type PositionC, type Visual_CompositeNestedGraphNode, type Visual_CompositeNestedGraphRoot } from "hopefox"
import type { Puzzle } from "./puzzles"
export enum CoverageResult {
    Tp,
    Fp,
    N
}

export type PartialCoverage = { 
    result: CoverageResult
    visual: Visual_CompositeNestedGraphRoot
}

export type BatchWorkOut = {
    puzzle: Puzzle
    coverage: PartialCoverage
}

export type BatchWorkIn = {
    code: string
}

export type BatchWorkContinuationOut = {
    total: number
    partial_out: BatchWorkOut[]
    is_ended: boolean
}

export type CompiledFn = (m: PositionManager, pos: PositionC) => Visual_CompositeNestedGraphRoot

export type ResumableBatch = {
    work_in: BatchWorkIn
    compiled_fn: CompiledFn
    resume_index: number
}

export class PuzzleBatchWorker {

    batch_size = 10
    id_gen = 1

    resumable_existing_batches: ResumableBatch | undefined

    constructor(private m: PositionManager, private puzzles: Puzzle[]) {}

    begin_work(work_in: BatchWorkIn) {

        let compiled_fn
        
        try {
            compiled_fn = usage(work_in.code)
        } catch (e) {

            throw new CompileError()
        }

        this.resumable_existing_batches = { 
            resume_index: 0,
            compiled_fn,
            work_in
        }
    }

    cancel_work() {
        this.resumable_existing_batches = undefined
    }

    step_work(): BatchWorkContinuationOut | undefined {
        let batch = this.resumable_existing_batches

        if (batch) {

            this.resumable_existing_batches = undefined

            let res = this.do_work(batch)

            if (res.end_index === undefined) {
                return {
                    total: this.puzzles.length,
                    partial_out: res.partial_out,
                    is_ended: true
                }
            } else {

                this.resumable_existing_batches = {
                    resume_index: res.end_index,
                    work_in: batch.work_in,
                    compiled_fn: batch.compiled_fn
                }

                return {
                    total: this.puzzles.length,
                    partial_out: res.partial_out,
                    is_ended: false
                }
            }
        }
    }

    private do_work(batch: ResumableBatch) {

        let resume_index = batch.resume_index
        let partial_out = []

        let end_index = Math.min(this.puzzles.length, resume_index + this.batch_size)

        const now = performance.now()
        for (let i = resume_index; i < end_index; i++) {
            let aaa = do_work_in_puzzle(this.m, this.puzzles[i], batch.compiled_fn)
            partial_out.push(aaa)
        }
        let elapsed_ms = performance.now() - now

        let per_puzzle_ms = elapsed_ms / (end_index - resume_index)

        this.batch_size = Math.floor(1000 / per_puzzle_ms)



        if (end_index === this.puzzles.length) {
            return {
                partial_out
            }
        }
        return {
            partial_out,
            end_index
        }
    }
}

function do_work_in_puzzle(m: PositionManager, puzzle: Puzzle, compiled_fn: CompiledFn): BatchWorkOut {
    let pos = m.create_position(puzzle.move_fens[0])
    let visual = compiled_fn(m, pos)

    m.delete_position(pos)

    let result = compare_coverage_result(visual, puzzle.sans)

    let coverage: PartialCoverage = {
        result,
        visual
    }
    return { puzzle, coverage }
}


function compare_coverage_result(visual: Visual_CompositeNestedGraphRoot, solution: string[]) {
    if (is_negative(visual)) {
        return CoverageResult.N
    }
    if (match_solution_root(visual, solution)) {
        return CoverageResult.Tp
    }
    return CoverageResult.Fp
}

export class CompileError extends Error {}

function is_negative(root: Visual_CompositeNestedGraphRoot) {
    function has_on_leaf(leaf: Visual_CompositeNestedGraphNode): boolean {
        if (leaf.children.length > 0) {
            return leaf.children.some(_ => has_on_leaf(_))
        }
        return temporary_dedup(leaf.data.call[0].witness).length === 1
    }

    function fail_cond(leaf: Visual_CompositeNestedGraphNode): boolean {
        if (leaf.children.length > 0) {
            return leaf.children.some(_ => fail_cond(_))
        }
        if (leaf.data.tags.includes('cond')) {
            if (leaf.data.call[0].witness.length === 0) {
                return true
            }
        }
        return false
    }



    if (root.some(_ => fail_cond(_))) {
        return true
    }

    return !root.some(_ => has_on_leaf(_))
}

function match_solution_root(res: Visual_CompositeNestedGraphRoot, solution: string[]) {
    return res.some(_ => match_solution_node(_, solution))
}

function match_solution_node(res: Visual_CompositeNestedGraphNode, solution: string[]): boolean {

    if (res.data.tags.includes('win')) {
        if (match_solution(res.data.call[0].witness, solution)) {
            return true
        }
    }
    
    return res.children.some(_ => match_solution_node(_, solution))
}


function match_solution(res: string[][], solution: string[]) {
   return res.some(_ => _.join(' ') === solution.join(' '))
}

function temporary_dedup(arr: string[][]) {

    let dd = new Set()

    let res = []

    for (let i = 0; i < arr.length; i++) {
        let str = arr[i].join(' ')
        if (!dd.has(str)) {
            dd.add(str)
            res.push(arr[i])
        }
    }
    return res
}