import { Dynamic, For, Show } from "solid-js/web"
import { useState } from "../state/State"
import { A } from "@solidjs/router"
import { createMemo, createSelector, createSignal, onCleanup, createEffect, } from "solid-js"
import './Main.scss'
import type { OpeningListModel } from "../state/idb_model"
import type { SingleLineMove } from "../state/types"

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

// @ts-ignore
const list = "asdfa,".repeat(30).split(',')
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
      <div class='stats'>
        <div class='accuracy-rate stat'>
          <div class='title'>Accuracy Score</div>
          <div class='value percent'>0.0%</div>
          <ProgressBar percent={50}/>
        </div>
        <div class='win-rate stat'>
          <div class='title'>Overall Win Rate</div>
          <div class='value percent'>0.0%</div>
          <ProgressBar percent={50}/>
        </div>
        <div class='nb-games stat'>
          <div class='title'>Total Games Played</div>
          <div class='value'>0</div>
        </div>
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

  const [{ linechess_state: state }, { linechess_actions: { set_open_add_new_line, select_opening_line, create_opening_line }}] = useState()

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

  return (<>
    <dialog open={state.is_add_new_line_modal_open}>
      <div onClick={close} class='dialog-backdrop'></div>
      <div class='create-new-opening-dialog-content'>
        <div class='panel'>
          <div class='body'>
            <div class='title'>Add New Opening Line</div>
            <div class='input-group'>
              <label>to list</label>
              <p class='list-name'>{state.selected_opening_list!.name}</p>
            </div>

            <div class='input-group'>
               <label for="opening_line_name">Opening Line Name</label>
               <input minLength={3} required={true} ref={$opening_line_name_text} id="opening_line_name" type='text' placeholder="Enter Line Name..."></input>
            </div>

            <div class='input-group'>
               <label for="opening_line_pgn">Opening Line PGN</label>
               <input aria-invalid={!!pgn_error()} minLength={8} required={true} ref={$opening_line_pgn_text} id="opening_line_pgn" type='text' placeholder="Enter Line PGN..."></input>
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
               <input minLength={3} required={true} ref={$opening_name_text} id="opening_name" type='text' placeholder="Enter Opening Name..."></input>
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

  const [,{ linechess_actions: { set_dashboard_tab }}] = useState()

  return (<>
    <div class='dc-dashboard'>
      <div class='info-action'>
        <div>
          <h2>Opening Performance</h2>
          <p>Breakdown of the opening lines played in recent matches</p>
        </div>
        <button onClick={() => set_dashboard_tab('repertoire')}class='import-pgn-btn primary'>Import PGN</button>
      </div>
      <RecentMatches/>
    </div>
  </>)
}

function RecentMatches() {

  const diverge = () => false
  const list = 'alkdsjadadf,'.repeat(30).split(',')
  return (<>
  <div class='matches-list'>
    <For each={list}>{ () => 
      <div class='match'>
        <div class='board'>
        </div>
        <div class='info'>
            <div class='situation'>
              <div class='type'>Blitz · Rated</div>
              <div class='time'>2 days ago</div>
            </div>
            <div class='vs'>
              <div class='players'>heroku vs yifan</div>
              <Show when={diverge()} fallback={
                <A href='https://lichess.org'>Analyse on Lichess</A>
              }>{ _diverge =>
                <div class='diverge'>
                  <span class='who'>You</span>
                  diverged after <span class='nb-moves'>2 moves</span> after <span class='after-move'>2.e5</span> with
                  <span class='move'>3.Nf3</span>
                </div>
              }</Show>
              <div class='outcome'>You won!</div>
            </div>
            <div class='opening'>
              <Show when={diverge()} fallback={
                <div class='nomatch'>No opening matched</div>
              }>
                <div class='name'>Queen's Gambit Declined · <span class='variation'>Advanced Variation</span></div>
              </Show>
              <div class='line'>1.e4 e5 2.Nf3 Nf6 ... 27 moves</div>

            </div>
        </div>
      </div>
    }</For>
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