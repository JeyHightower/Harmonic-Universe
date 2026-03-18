import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './components/Auth/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from './components/Dashboard/Dashboard';
import { Layout } from './components/Layout';
import { Register } from './components/Auth/Register';

function App() {
  

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
        <Route path="dashboard" element={<Dashboard />}>
          
          </Route>
          </Route>
        </Route> 
      </Routes>
    </BrowserRouter>
  )
}

export default App
