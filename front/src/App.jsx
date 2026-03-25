import './App.css'
import Chat from './chat.jsx'
import Dashboard from './Dashboard.jsx'
import Login from './login.jsx'
import Protection from './protectroute.jsx'
import Register from './register.jsx'

import { BrowserRouter, Routes, Route } from "react-router-dom"

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/register" element={<Register />} />
        <Route
          path="/dash"
          element={
            <Protection>
              <Dashboard />
            </Protection>
          }
        />
        <Route path='/chat' element={<Protection><Chat /></Protection>} />

      </Routes>

    </BrowserRouter>

  )

}

export default App