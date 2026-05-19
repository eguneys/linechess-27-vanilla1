import { Dynamic, For, Show } from "solid-js/web"
import { useState } from "../state/State"
import { A } from "@solidjs/router"
import { createSelector } from "solid-js"
import './Main.scss'

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

function RepertoireContent() {
  return (<>
    <div class='dc-repertoire'>

    </div>
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