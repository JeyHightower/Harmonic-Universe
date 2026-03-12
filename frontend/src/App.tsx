import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './components/Auth/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from './components/Dashboard/Dashboard';

function App() {
  

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />}></Route>
        
          </Route>
      </Routes>
    </BrowserRouter>
  )
}
export default App
