import { Outlet } from 'react-router-dom';
import Footer from './Footer';

/**
 * Simple Layout component that provides basic structure
 * Wraps page content with footer and basic styling
 */
const Layout = () => {
  return (
    <div className="layout">
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
