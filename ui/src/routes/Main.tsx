import { Dynamic, For, Show } from "solid-js/web"
import { useState } from "../state/State"
import { A } from "@solidjs/router"
import { createMemo, createSelector, createSignal, onCleanup, createEffect, } from "solid-js"
import './Main.scss'
import type { OpeningListModel } from "../state/idb_model"
import type { OpeningDiverge, RecentMatch, SingleLineMove } from "../state/types"

function Main() {

  let [{linechess_state: state}] = useState()
  return (<>
    <main>
      <div class='main-dashboard-tabs'>
        <DashboardTabs />
        <div class='dashboard-content'>
          <Dynamic component={TabContents[state.dashboard_tab]} />
        </div>
      </div>
    </main>
  </>)
}

const TabContents = {
  dashboard: DashboardContent,
  repertoire: RepertoireContent
}

function RepertoireContent() {

  const [{ linechess_state: state }, { linechess_actions: { set_open_create_new_opening, select_opening_list } }] = useState()

  const is_selected_opening = createSelector(() => state.selected_opening_list_id)

  return (<>
    <div class='dc-repertoire'>
      <div class='re-library'>
        <div class='opening-list'>
          <div class='header'>
            <span class='title'>Library</span>
            <button onClick={() => set_open_create_new_opening(true)} class='secondary'>+ New Opening</button>
          </div>
          <div class='content'>
            <For each={state.opening_lists}>{ item =>
              <div onClick={() => select_opening_list(item.id)} class='opening' classList={{active: is_selected_opening(item.id)}}>
                {item.name}
              </div>
            }</For>
          </div>
        </div>
        <div class='opening-lines'>
          <Show when={state.selected_opening_list} fallback={
            <div class='no-content'>
              <div class='circle'></div>
              No Repertoire Selected
              <p class='info'>
                Initialize an opening from the library to add new opening lines
              </p>
            </div>
          }>{ list => 
            <OpeningListViewOnPanel list={list()}/>
            }</Show>
        </div>
      </div>
      <Show when={state.is_create_new_opening_modal_open}>
        <CreateNewOpeningDialog />
      </Show>
      <Show when={state.is_add_new_line_modal_open}>
        <AddNewLineOpeningDialog />
      </Show>
    </div>
  </>)
}

function OpeningListViewOnPanel(props: {list: OpeningListModel}) {


  const [{ linechess_state: state }, { linechess_actions: {delete_opening_list, set_open_add_new_line, select_opening_line, delete_selected_line } }] = useState()

  const delete_this_opening_list = () => {
    delete_opening_list(props.list.id)
  }

  const is_selected_line = createSelector(() => state.selected_opening_line_id)

  return (<>
    <div class='opening-lines-view'>
      <div class='header'>
        <span class='title'>{props.list.name}</span>
        <button onClick={() => set_open_add_new_line(true)} class='primary'>+ Add new Line</button>
      </div>
      <div class='body'>
      <Show when={props.list.lines.length > 0} fallback={
        <div class='no-lines'>
          <div class='circle'></div>
          No Lines listed
          <p class='info'>
            Add an opening line to get started
          </p>
        </div>
      }>{
            <div class='lines'>
              <div class='list'>
                <For each={props.list.lines}>{line =>
                  <div onClick={() => select_opening_line(line.id)} class='line' classList={{active: is_selected_line(line.id)}}>{line.name}</div>
                }</For>
              </div>
              <div class='info'>
                <Show when={state.selected_opening_line}>{ line =>
                  <>
                    <div class='info-header'>
                      <div class='title'>{line().name}</div>
                    </div>
                    <PgnLine line={line().moves} />
                  </>
                }</Show>
              </div>
            </div>
        }</Show>
      </div>
      <div class='footer'>
        <button onClick={delete_this_opening_list} class='delete'>Delete opening list</button>
        <Show when={state.selected_opening_line}>
          <button onClick={delete_selected_line} class='delete'>Delete selected line</button>
        </Show>
      </div>
    </div>
  </>)
}

function PgnLine(props: { line: SingleLineMove[] }) {
  return (<>
    <div class='pgn'>
      <div class='pgn-list'>
        <div>
          <For each={props.line}>{move =>
            <div class='move'>
              <Show when={ply_to_display(move.ply)}>{index =>
                <span class='index'>{index()}</span>
              }</Show>{move.san}</div>
          }</For>
        </div>
      </div>

    </div>
  </>)
}

export function LineStatistics() {

  return (<>
    <div class='stats'>
      <div class='accuracy-rate stat'>
        <div class='title'>Accuracy Score</div>
        <div class='value percent'>0.0%</div>
        <ProgressBar percent={50} />
      </div>
      <div class='win-rate stat'>
        <div class='title'>Overall Win Rate</div>
        <div class='value percent'>0.0%</div>
        <ProgressBar percent={50} />
      </div>
      <div class='nb-games stat'>
        <div class='title'>Total Games Played</div>
        <div class='value'>0</div>
      </div>
    </div>
  </>)
}

function ProgressBar(props: { percent: number }) {

  const [t, set_t] = createSignal(0)

  const fill_bar = createMemo(() => props.percent * ease_springOut(t()))

  const fill_timer_fn = () => {
    set_t(t() + 0.009)
    if (t() >= 1) {
      set_t(1)
    } else {
      timer_id = requestAnimationFrame(fill_timer_fn)
    }
  }
  let timer_id = requestAnimationFrame(fill_timer_fn)


  onCleanup(() => {
    cancelAnimationFrame(timer_id)
  })

  let $bar!: HTMLDivElement

  createEffect(() => {
    if ($bar) $bar.style.width = `${fill_bar()}%`
  })

  return (<>
    <div class='progress-bar'><div ref={$bar} class='bar'></div></div>
  </>)
}
function ease_springOut(t: number) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function AddNewLineOpeningDialog() {

  const [pgn_error, set_pgn_error] = createSignal('')

  const [{ linechess_state: state }, { linechess_actions: { set_open_add_new_line, select_opening_line, create_opening_line, select_opening_list }}] = useState()

  const close = () => set_open_add_new_line(false)

  const add_new_opening_line = async () => {

    if (!$opening_line_name_text.checkValidity()) {
      $opening_line_name_text.reportValidity()
      return
    }
    let value = $opening_line_name_text.value

    if (!$opening_line_pgn_text.checkValidity()) {
      $opening_line_pgn_text.reportValidity()
      return
    }
    let pgn_value = $opening_line_pgn_text.value


    try {
      set_pgn_error('')
      let id = await create_opening_line(value, pgn_value)
      if (id !== undefined) {
        select_opening_line(id)
      }
      close()
    } catch (e) {
      set_pgn_error('Invalid PGN')
    }
  }

  const paste_pgn = () => {
    navigator.clipboard.readText().then(text => {
      $opening_line_pgn_text.value = text
    })
  }

  let $opening_line_name_text!: HTMLInputElement
  let $opening_line_pgn_text!: HTMLInputElement

  let $selected_opening_list!: HTMLSelectElement

  return (<>
    <dialog open={state.is_add_new_line_modal_open}>
      <div onClick={close} class='dialog-backdrop'></div>
      <div class='create-new-opening-dialog-content'>
        <div class='panel'>
          <div class='body'>
            <div class='title'>Add New Opening Line</div>
            <div class='input-group'>
              <label>to list</label>
              <select onChange={() => select_opening_list($selected_opening_list.value)} ref={$selected_opening_list} value={state.selected_opening_list?.id} name="list_name">
                <For each={state.opening_lists}>{ item =>
                  <option value={item.id}>{item.name}</option>
                }</For>
              </select>
            </div>

            <div class='input-group'>
               <label for="opening_line_name">Opening Line Name</label>
               <input minLength={3} required={true} ref={$opening_line_name_text} id="opening_line_name" type='text' placeholder="Enter Line Name..."></input>
            </div>

            <div class='input-group'>
               <label for="opening_line_pgn">Opening Line PGN</label>
               <input spellcheck="false" autocorrect="off" aria-invalid={!!pgn_error()} minLength={8} required={true} ref={$opening_line_pgn_text} id="opening_line_pgn" type='text' placeholder="Enter Line PGN..." value={state.add_new_line_pgn}></input>
               <Show when={pgn_error()}>{error =>
                <div class='error'>{error()}</div>
              }</Show>
              <button onClick={paste_pgn} class='secondary'>Paste PGN</button>
            </div>
          </div>
          <div class='action'>
            <button type="submit" onClick={add_new_opening_line} class='primary'>Add New Line</button>
            <button onClick={close} class='secondary'>Cancel</button>
          </div>
        </div>
      </div>
    </dialog>
  </>)
}



function CreateNewOpeningDialog() {

  const [{ linechess_state: state },{ linechess_actions: { set_open_create_new_opening, create_opening_list, select_opening_list }}] = useState()

  const close = () => set_open_create_new_opening(false)

  const add_new_opening = async () => {

    if (!$opening_name_text.checkValidity()) {
      $opening_name_text.reportValidity()
      return
    }
    let value = $opening_name_text.value
    try {
      let id = await create_opening_list(value)
      if (id !== undefined) {
        select_opening_list(id)
      }
    } catch (e) {

      alert(e)
    }
    close()
  }

  const on_key_press = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      add_new_opening()
    }

  }

  let $opening_name_text!: HTMLInputElement

  return (<>
    <dialog open={state.is_create_new_opening_modal_open}>
      <div onClick={close} class='dialog-backdrop'></div>
      <div class='create-new-opening-dialog-content'>
        <div class='panel'>
          <div class='body'>
            <div class='title'>Add New Opening</div>

            <div class='input-group'>
               <label for="opening_name">Opening Name</label>
               <input onkeypress={on_key_press} minLength={3} required={true} ref={$opening_name_text} id="opening_name" type='text' placeholder="Enter Opening Name..."></input>
            </div>
          </div>
          <div class='action'>
            <button type="submit" onClick={add_new_opening} class='primary'>Add New Opening</button>
            <button onClick={close} class='secondary'>Cancel</button>
          </div>
        </div>
      </div>
    </dialog>
  </>)
}

function DashboardContent() {

  const [{ dashboard_state: state },{ linechess_actions: { set_dashboard_tab }, dashboard_actions: { set_search_handle }}] = useState()

  let $search_handle!: HTMLInputElement

  const on_set_search_handle = () => {
    set_search_handle($search_handle.value)
  }

  return (<>
    <div class='dc-dashboard'>
      <div class='info-action'>
        <div>
          <h2>Opening Performance</h2>
          <p>Breakdown of the opening lines played in recent matches</p>
        </div>
      </div>

      <div class="breakdown">
        <button onClick={on_set_search_handle} class='primary' classList={{'needs-search': state.search_handle_name === '' }}>Search</button>
        <input spellcheck="false" autocorrect="off" onChange={on_set_search_handle} ref={$search_handle} class='search' type='text' placeholder="Enter Lichess handle..."/>
      </div>
      <Show when={state.search_handle} fallback={
        <NeedsSearch/>
      }>
        <WelcomeFitnessScore/>
        <RecentMatches />
      </Show>
    </div>
  </>)
}

function NeedsSearch() {
  return (<>
    <div class='no-content needs-search'>
      <div class='circle'></div>
      <p class='info'>
        Search for a player to display performance
      </p>
    </div>
  </>)
}

function WelcomeFitnessScore() {

  const [{ dashboard_state: state }] = useState()

  const handle = createMemo(() => state.search_handle!)

  return (<>
    <div class='welcome-fitness'>
      <div class='welcome-info'>
        <div class='welcome'>Hi, <A href={`https://lichess.org/@/${handle().handle}`} target='_blank'>{handle().username}</A></div>
        <div class='last-checked'>Recent games should appear shortly</div>
      </div>
      <div class='fitness stats'>
        <div class='stat background-container'>
          <OpacityBlurShow when={handle().is_fetching_recent_games}/>
          <div class='title'>Today's Fitness Score</div>
          <div class='value percent'>{format_fitness_score(handle().fitness_score.fitness_score * 100)}</div>
          <ProgressBar percent={handle().fitness_score.fitness_score * 100} />
        </div>
        <div class='stat nb-played background-container'>
          <OpacityBlurShow when={handle().is_fetching_recent_games}/>
          <div class='title'>Games Played Today</div>
          <div class='times'>
            <div class='time'>
              <div class='sub'>Bullet</div>
              <div class='value percent'>{format_zero(handle().nb_bullet, 2)}</div>
            </div>
            <div class='time'>
              <div class='sub'>Blitz</div>
              <div class='value percent'>{format_zero(handle().nb_blitz, 2)}</div>
            </div>
            <div class='time'>
              <div class='sub'>Rapid</div>
              <div class='value percent'>{format_zero(handle().nb_rapid)}</div>
            </div>
            <div class='time'>
              <div class='sub'>Classical</div>
              <div class='value percent'>{format_zero(handle().nb_classical)}</div>
            </div>
          </div>
          <ProgressBar percent={handle().fitness_score.nb_played_score * 100} />
        </div>
      </div>
    </div>
  </>)
}

function OpacityBlurShow(props: { when: boolean }) {

  const [t, set_t] = createSignal(0)

  const fill_opacity = createMemo(() => {
     let res = t() * ease_springOut(t())
     if (!props.when) {
      return 1 - res
     } else {
      return res
     }
  })

  const fill_timer_fn = () => {
    set_t(t() + 0.1)
    if (t() >= 1) {
      set_t(1)
      set_timer_id(-1)
    } else {
      set_timer_id(requestAnimationFrame(fill_timer_fn))
    }

    $el.style.opacity = `${fill_opacity()}`
  }

  let [timer_id, set_timer_id] = createSignal(0)

  createEffect(() => {
    props.when
    set_t(0)
    set_timer_id(requestAnimationFrame(fill_timer_fn))
  })


  onCleanup(() => {
    cancelAnimationFrame(timer_id())
    set_timer_id(requestAnimationFrame(fill_timer_fn))
  })

  let $el!: HTMLDivElement

  return (<>
    <Show when={fill_opacity() !== 0}>
      <div ref={$el} class='calculating-overlay'>
        <div class="spinner"></div>
      </div>
    </Show>
  </>)
}

export function DashboardWithLoginExtra() {
  const [{ dashboard_state: dashboard },] = useState()
  return (<>
    <Show when={dashboard.logged_in_user} fallback={
      <LoginWithLichess />
    }>{
        <>
          <WelcomeLoggedIn />
          <RecentMatches />
        </>
      }</Show>
  </>)
}
function WelcomeLoggedIn() {
  return (<>
  <div class='welcome'>
    Welcome heroku
  </div>
  </>)
}
function LoginWithLichess() {
  return (<>
    <div class='login'>
      <button onClick={() => {}} class='primary'>Login with Lichess</button>
      <p>To see how you performed on your recent matches with your saved opening lines</p>
    </div>
  </>)

}

function RecentMatches() {

  const [{ dashboard_state: state }, { linechess_actions }] = useState()

  const goto_opening = (diverge: OpeningDiverge) => {

    let list_id = diverge.most_matched_opening.list.id
    let line_id = diverge.most_matched_opening.id

    linechess_actions.select_opening_list(list_id)
    linechess_actions.select_opening_line(line_id)


    linechess_actions.set_dashboard_tab('repertoire')
    window.scrollTo({ top: 0 })
  }

  const on_click_match = (match: RecentMatch) => {

    if (match.opening.diverge) {
      goto_opening(match.opening.diverge)
    } else {
      window.location.href = `https://lichess.org/${match.lichess_game_id}`
    }
  }


  const on_add_to_repertoire = (match: RecentMatch) => {

    let moves = match.opening.moves

    let diverge = match.opening.diverge
    if (diverge) {
      let list_id = diverge.most_matched_opening.list.id
      let line_id = diverge.most_matched_opening.id

      linechess_actions.select_opening_list(list_id)
      linechess_actions.select_opening_line(line_id)

    }

    linechess_actions.set_open_add_new_line(true, moves.slice(0, 40).map((san, i) => {
      let ply = i % 2 === 0 ? `${Math.ceil((i + 1) / 2)}. ` : ''
      return `${ply}${san}`
    }).join(' '))
    linechess_actions.set_dashboard_tab('repertoire')
    window.scrollTo({ top: 0 })
  }

  return (<>
  <div class='matches-list'>
    <For each={state.search_handle?.recent_matches} fallback={
      <div class='no-match no-content'>
          <div class='circle'></div>
          No Recent Matches played
          <p class='info'>
            Play some games with this player to display performance
          </p>
        </div>
    }>{ item => 
      <div onClick={() => on_click_match(item)} class='match'>
        <div class='board'>
        </div>
        <div class='info'>
            <div class='situation'>
              <div class='type'><span class='speed'>{item.speed}</span> · {item.is_rated?'Rated':'Unrated'}</div>
              <div class='time'>{MomentsAgo(item.game_created_at)}</div>
            </div>
            <div class='vs'>
                <A href={`https://lichess.org/${item.lichess_game_id}`}>
                  <span class='players'>  {item.white} vs {item.black}</span>
                </A>
              <Show when={item.opening.diverge} fallback={
                <>
                </>
              }>{ diverge =>
                <div class='diverge'>
                  After <span class='after-move'>{ply_to_dots(diverge().after_ply)}{diverge().after_move}</span> &nbsp;
                      <span class='who'>{diverge().did_you_diverge ? 'You' : 'They'}</span>
                      diverged  with
                  <span class='move'>{ply_to_dots(diverge().diverge_ply)}{diverge().diverge_move}</span>
                </div>
              }</Show>
                <div class='outcome'>{item.did_you_draw ? `You drew!` : item.did_you_win ? 'You won!' : 'You lost!'}</div>

              </div>
              <div class='opening-and-controls'>
                <div class='opening'>
                  <Show when={item.opening.diverge} fallback={
                    <div class='nomatch'>No opening matched :[</div>
                  }>{diverge =>
                    <div class='name'>{diverge().most_matched_opening.list.name} · <span class='variation'>{diverge().most_matched_opening.name}</span></div>
                    }</Show>
                  <OpeningLineLittleView moves={item.opening.moves} />
                </div>

                <button onClick={e => { e.stopPropagation(); on_add_to_repertoire(item)}} class='primary'>+ Add to repertoire</button>
              </div>
            </div>
      </div>
    }</For>
  </div>
  </>)
}

function OpeningLineLittleView(props: { moves: string[] }) {
  return (<>
  <div class='little-line'>
      <div class='list'>
        <For each={props.moves.slice(0, 13)}>{(move, index) =>
          <span class='move'><span class='index'>{index() % 2 === 0 ? `${index() / 2 + 1}.` : ''}</span> {move}</span>
        }</For>
      </div>
      <span>{Math.ceil(props.moves.length / 2)} moves</span>
  </div>
  </>)
}

function DashboardTabs() {
  let [{linechess_state: state}, { linechess_actions: { set_dashboard_tab }}] = useState()

  const is_selected = createSelector(() => state.dashboard_tab)

  return (<>
    <div class='dashboard-tabs'>
      <div onClick={() => set_dashboard_tab('dashboard')} class='tab' classList={{ active: is_selected('dashboard')}}>Dashboard</div>
      <div onClick={() => set_dashboard_tab('repertoire')} class='tab' classList={{ active: is_selected('repertoire')}}>Repertoire</div>
    </div>
  </>)
}


export default Main


export function ply_to_display(ply: number) {
    return (ply % 2 === 1) ? `${Math.ceil(ply / 2)}.` : ''
}

export function format_fitness_score(value: number) {
  return value ? `${value.toFixed(2)}%` : '--.--'
}

export function format_zero(value: number, repeat = 1) {
  return value ? value : '-'.repeat(repeat)
}

export function MomentsAgo(timestamp: number) {

  const [now, set_now] = createSignal(Date.now())

  let interval_id = setInterval(() => set_now(Date.now()), 30 * 1000)

  onCleanup(() => clearInterval(interval_id))

  return <>
    {formatMomentsAgo(now(), timestamp)}
  </>
}

export function formatMomentsAgo(now: number, timestamp: number): string {
    const seconds = Math.floor((now - timestamp) / 1000)

    if (seconds < 1) return "just now"
    if (seconds < 60) return `${seconds}s ago`

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`

    const months = Math.floor(days / 30)
    if (months < 12) return `${months}mo ago`

    const years = Math.floor(months / 12)
    return `${years}y ago`
}

const ply_to_dots = (ply: number) => {
  return (ply % 2 === 0) ? `${Math.ceil((ply + 1) / 2)}.` : `${Math.ceil((ply + 1) / 2)}...`
}