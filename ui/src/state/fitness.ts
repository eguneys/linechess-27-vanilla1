import type { AllowedSpeed, RecentMatch } from "./types"

export type FitnessPlayStatsForSpeed = {
    nb_played_today: number
    nb_your_diverge: number
    nb_their_diverge: number
    nb_novelty: number
    params: FitnessStatsParameters
    fitness_score: number
}

export type FitnessScore = {
    play_stats_by_speed: Record<AllowedSpeed, FitnessPlayStatsForSpeed>
    fitness_score: number
    nb_played_score: number
}


export function calculate_fitness_score(matches: RecentMatch[]): FitnessScore {

    const sum_nb_played_score = (stats: Record<AllowedSpeed, FitnessPlayStatsForSpeed>) => {
        let a = 0

        a += Math.min(1, stats.blitz.nb_played_today / stats.blitz.params.nb_played_goal)
        a += Math.min(1, stats.bullet.nb_played_today / stats.bullet.params.nb_played_goal)
        a += Math.min(1, stats.rapid.nb_played_today / stats.rapid.params.nb_played_goal)
        a += Math.min(1, stats.classical.nb_played_today / stats.classical.params.nb_played_goal)

        return a / 4
    }

    const calculate_the_fitness_score_from_stats = (stats: Record<AllowedSpeed, FitnessPlayStatsForSpeed>) => {

        const blitz_rate = 0.25
        const bullet_rate = 0.15
        const rapid_rate = 0.3
        const classical_rate = 0.3

        let blitz = stats['blitz'].fitness_score
        let bullet = stats['bullet'].fitness_score
        let rapid = stats['rapid'].fitness_score
        let classical = stats['classical'].fitness_score

        let a = 0
        
        a += blitz * blitz_rate
        a += bullet * bullet_rate
        a += rapid * rapid_rate
        a += classical * classical_rate

        return a
    }

    const calculate_the_fitness_score_for_stats = (stats: FitnessPlayStatsForSpeed) => {

        const nb_games_rate = 0.4
        const nb_your_diverge_rate = 0.3
        const nb_their_diverge_rate = 0.2
        const nb_novelty_rate = 0.1

        let a = 0

        a += Math.min(1, stats.nb_played_today / stats.params.nb_played_goal) * nb_games_rate
        a += Math.min(1, stats.nb_your_diverge / stats.params.nb_your_max_diverge) * nb_your_diverge_rate
        a += Math.min(1, stats.nb_their_diverge / stats.params.nb_their_max_diverge) * nb_their_diverge_rate
        a += Math.min(1, stats.nb_novelty / stats.params.nb_novelty_max) * nb_novelty_rate

        return a
    }

    const push_match_to_stats = (match: RecentMatch, stats: FitnessPlayStatsForSpeed) => {

        let nb_played_today = stats.nb_played_today + 1
        let nb_your_diverge = stats.nb_your_diverge
        let nb_their_diverge = stats.nb_their_diverge
        let nb_novelty = stats.nb_novelty
        let params = stats.params

        if (match.opening.diverge) {
            if (match.opening.diverge.did_you_diverge) {
                nb_your_diverge += 1
            } else {
                nb_their_diverge += 1
            }
        } else {
            nb_novelty += 1
        }


        let res = {
            nb_played_today,
            nb_your_diverge,
            nb_their_diverge,
            nb_novelty,
            params,
            fitness_score: 0
        }

        res.fitness_score = calculate_the_fitness_score_for_stats(res)

        return res
    }

    const empty_stats = (params: FitnessStatsParameters) => {

        return {
            nb_played_today: 0,
            nb_your_diverge: 0,
            nb_their_diverge: 0,
            nb_novelty: 0,
            params,
            fitness_score: 0
        }
    }

    let play_stats_by_speed = {
        bullet: empty_stats(stats_params['bullet']),
        blitz: empty_stats(stats_params['blitz']),
        rapid: empty_stats(stats_params['rapid']),
        classical: empty_stats(stats_params['classical'])
    }

    for (let match of matches) {
        play_stats_by_speed[match.speed] = push_match_to_stats(match, play_stats_by_speed[match.speed])
    }


    let fitness_score = calculate_the_fitness_score_from_stats(play_stats_by_speed)

    let nb_played_score = sum_nb_played_score(play_stats_by_speed)

    return {
        play_stats_by_speed,
        fitness_score,
        nb_played_score
    }
}

type FitnessStatsParameters = {
    nb_played_goal: number,
    nb_your_max_diverge: number
    nb_their_max_diverge: number
    nb_novelty_max: number
}


const stats_params: Record<AllowedSpeed, FitnessStatsParameters> = {
    bullet: {
        nb_played_goal: 16,
        nb_your_max_diverge: 6,
        nb_their_max_diverge: 8,
        nb_novelty_max: 2
    },
    blitz: {
        nb_played_goal: 16,
        nb_your_max_diverge: 5,
        nb_their_max_diverge: 7,
        nb_novelty_max: 4
    },
    rapid: {
        nb_played_goal: 10,
        nb_your_max_diverge: 3,
        nb_their_max_diverge: 5,
        nb_novelty_max: 2
    },
    classical: {
        nb_played_goal: 2,
        nb_your_max_diverge: 1,
        nb_their_max_diverge: 1,
        nb_novelty_max: 1
    },
}