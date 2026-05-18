import { createSelector, For } from 'solid-js'
import './App.scss'
import { LinechessProvider, useState } from './state/State'
import { Dynamic } from 'solid-js/web'

function App() {
  return (<>
    <LinechessProvider>
      <div class='app'>

        <Header />
        <div class='main-wrapper'>
          <Main/>
        </div>
      </div>
    </LinechessProvider>
  </>)
}

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
  const list = 'alkdsjadadf,'.repeat(30).split(',')
  return (<>
  <div class='matches-list'>
    <For each={list}>{ () => 
      <div class='match'>
        <div class='details'>Blitz · Rated </div>
        <div class='vs'>heroku vs yifan</div>
        <div class='outcome'>You won!</div>
        <div class='opening'>
            <div class='name'>Queen's Gambit Declined · <span class='variation'>Advanced Variation</span></div>
            <div class='line'>1.e4 e5 2.Nf3 Nf6 ... 27 moves</div>
            <div class='diverge'>
              <span class='who'>You</span>
              diverged after <span class='nb-moves'>2 moves</span> with 
              <span class='move'>3.Nf3</span>
            </div>
        </div>
      </div>
    }</For>
  </div>
  </>)
}

function Header() {
  return (<>
    <header>
      <div class='title'><div class='logo'></div> Line Chess</div>
    </header>
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

export default App
