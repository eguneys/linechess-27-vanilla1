import { Dynamic, For, Show } from "solid-js/web"
import { useState } from "../state/State"
import { A } from "@solidjs/router"
import { createSelector, } from "solid-js"
import './Main.scss'
import type { OpeningListModel } from "../state/idb_model"

function Main() {

  let [{linechess_state: state}] = useState()
  return (<>
    <main>
      <DashboardTabs />
      <div class='dashboard-content'>
        <Dynamic component={TabContents[state.dashboard_tab]}/>
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
    </div>
  </>)
}

function OpeningListViewOnPanel(props: {list: OpeningListModel}) {


  const [, { linechess_actions: {delete_opening_list} }] = useState()

  const delete_this_opening_list = () => {
    delete_opening_list(props.list.id)
  }

  return (<>
    <div class='opening-lines-view'>
      <div class='header'>
        <span class='title'>{props.list.name}</span>
        <button class='primary'>+ Add new Line</button>
      </div>
      <div class='body'>
      <For each={props.list.lines} fallback={
        <div class='no-lines'>
          <div class='circle'></div>
          No Lines listed
          <p class='info'>
            Add an opening line to get started
          </p>
        </div>
      }>{() =>
        <div class='lines'>
        </div>
        }</For>
      </div>
      <div class='footer'>
        <button onClick={delete_this_opening_list} class='delete'>Delete opening list</button>
        <button class='delete'>Delete selected line</button>
      </div>
    </div>
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
    let id = await create_opening_list(value)
    if (id !== undefined) {
      select_opening_list(id)
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
  return (<>
    <div class='dc-dashboard'>
      <div class='info-action'>
        <div>
          <h2>Opening Performance</h2>
          <p>Breakdown of the opening lines played in recent matches</p>
        </div>
        <button class='import-pgn-btn primary'>Import PGN</button>
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