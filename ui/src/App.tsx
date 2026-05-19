import { lazy, type JSX } from 'solid-js'
import './App.scss'
import { LinechessProvider } from './state/State'
import { A, Route, Router } from '@solidjs/router'

const Main = lazy(() => import('./routes/Main'))

function Header() {
  return (<>
    <header>
      <A href="/"><div class='title'><div class='logo'></div> Line Chess</div></A>
    </header>
  </>)
}

function Layout(props: { children?: JSX.Element }) {
  return (<>
    <div class='app'>
      <Header />
      <div class='main-wrapper'>
        {props.children}
      </div>
    </div>
  </>)
}

function App() {
  return (<>
    <LinechessProvider>
      <Router root={Layout}>
        <Route path='/' component={Main}/>
      </Router>
    </LinechessProvider>
  </>)
}

export default App
