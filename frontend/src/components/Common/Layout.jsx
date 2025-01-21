import { useSelector } from 'react-redux';
import Header from './Header';
import Sidebar from './Sidebar';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className={styles.layout}>
      <Header />
      {user && <Sidebar />}
      <main className={styles.mainContent}>
        <div className={styles.container}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
