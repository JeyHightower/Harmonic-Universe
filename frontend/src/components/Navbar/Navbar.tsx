import styles from './Navbar.module.css';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useUniversalToolbox';
import { useUniversalToolbox } from '../../hooks/useUniversalToolbox';

export const Navbar = () => {
    const { isAuthenticated, user } = useAppSelector(state => state.auth);
    const { useBooleanSetter, useListSetter } = useUniversalToolbox()

    const menu = useBooleanSetter(false);
    const activity = useListSetter<string>([]);

    const trackAction = (msg: string) => {
        activity.addUnique(msg)
    }
    
    return (
        <nav className={styles.navbar}>
           <div className={styles.navLogo}>
                <Link to='/' onClick={() => trackAction('Clicked Logo')}>MyApp</Link>
            </div>
            <button className={styles.menuBurger} onClick={menu.toggle}>
                {menu.boolean ? 'x' : '☰'} 
            </button>

            <ul className={`${styles.navLinks} ${menu.boolean ? styles.open : ''}`}>
                <li><Link to='/' onClick={() => trackAction('Nav to Home')}>Home</Link></li>
                {isAuthenticated ? (
                    <>
                    <li> <Link to='/dashboard' onClick={() =>trackAction('Nav to Dash')}>Dashboard</Link> </li>
                    <li className={styles.userProfile}>Hi, {user?.username}</li>
                    </>
                ): (
                    <>
                    <li> <Link to='/login'>Login</Link></li>
                    <li><Link to='/register'>Register</Link></li>
                    </>
                
                )}
            </ul>
            <div className={styles.activityDropdown}>
                <span>Recent Activity ({activity.list.length})</span>
                <div className={styles.dropdownContent}>
                    {activity.list.map((item, i) => (
                        <p key={i} className={styles.activityItem}>{new Date().toLocaleTimeString()} - {item}</p>
                    ))}
                    {activity.list.length > 0 && <button className={styles.clearBtn} onClick={activity.clear}>Clear</button>}
                </div>
            </div>
        </nav>

    );
};