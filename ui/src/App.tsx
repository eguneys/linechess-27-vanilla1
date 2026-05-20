import { lazy, type JSX } from 'solid-js'
import './App.scss'
import { LinechessProvider } from './state/State'
import { A, Route, Router } from '@solidjs/router'

const Main = lazy(() => import('./routes/Main'))
const About = lazy(() => import('./routes/About'))
const Legal = lazy(() => import('./routes/Legal'))
const NotFound = lazy(() => import('./routes/NotFound'))

function Header() {
  return (<>
    <header>
      <A href="/"><div class='title'><div class='logo'><img alt="Line Chess Logo" src="/logo-big.png"></img></div> Line Chess</div></A>
    </header>
  </>)
}

function Footer() {
  return (<>
    <footer>
      <A href='/about'>About</A>
      <span>·</span>
      <A href='/legal'>Legal</A>
      <span>·</span>
      <A class='out' href='https://github.com/eguneys/linechess-27-vanilla1'>Github</A>
    </footer>
  </>)
}

function Layout(props: { children?: JSX.Element }) {
  return (<>
    <div class='app'>
      <Header />
      <div class='main-wrapper'>
        {props.children}
      </div>
      <Footer/>
    </div>
  </>)
}

function App() {
  return (<>
    <LinechessProvider>
      <Router root={Layout}>
        <Route path='/' component={Main}/>
        <Route path='/about' component={About}/>
        <Route path='/legal' component={Legal}/>
        <Route path='*404' component={NotFound}/>
      </Router>
    </LinechessProvider>
  </>)
}

export default App
