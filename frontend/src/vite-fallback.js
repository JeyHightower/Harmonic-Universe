/**
 * Vite build fallback - Creates a module exports compatibility layer for problematic imports
 * This file is used to polyfill modules that Vite has trouble resolving during the build
 */

// Create mock exports for react-router-dom
export const BrowserRouter = ({ children }) => children;
export const Routes = ({ children }) => children;
export const Route = () => null;
export const Navigate = () => null;
export const Outlet = () => null;
export const useNavigate = () => () => { };
export const useLocation = () => ({ pathname: '/' });
export const useParams = () => ({});
export const Link = ({ to, children }) => children;
export const NavLink = ({ to, children }) => children;

// Default export
export default {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
  useParams,
  Link,
  NavLink
}; 