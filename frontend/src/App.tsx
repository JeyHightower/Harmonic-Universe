import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './components/Auth/Login';
import { ProtectedRoute } from './components/Universal/ProtectedRoute';
import { Layout } from './components/Universal/Layout';
import { Register } from './components/Auth/Register';
import { Home } from './components/Home/Home';
import { CharacterDetail } from './components/Character/CharacterDetail';
import { Characters } from './components/Character/Characters';
import { LocationDetail } from './components/Location/LocationDetail';
import { Locations } from './components/Location/Locations';
import { NoteDetail } from './components/Note/NoteDetail';
import { Notes } from './components/Note/Notes';
import { UniverseDetail } from './components/Universe/UniverseDetail';
import { Universes } from './components/Universe/Universes';
import { Dashboard } from './components/Dashboard/Dashboard';

function App() {


  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
  
        <Route element={<ProtectedRoute />}>
          {/* Dashboard is its own page */}
          <Route path="dashboard" element={<Dashboard />} />
  
          {/* These are now siblings to dashboard. URL: /universes */}
          <Route path="universes" element={<Universes />} />
          <Route path="locations" element={<Locations />} />
          <Route path="characters" element={<Characters />} />
          <Route path="notes" element={<Notes />} />
  
          {/* Detail views. URL: /universes/123 */}
          <Route path="universes/:uniId" element={<UniverseDetail />} />
          <Route path="locations/:locId" element={<LocationDetail />} />
          <Route path="characters/:charId" element={<CharacterDetail />} />
          <Route path="notes/:noteId" element={<NoteDetail />} />
        </Route>
        
      </Route>
    </Routes>
  </BrowserRouter>
  )
}

export default App
