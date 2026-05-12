import { Link } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useSetterToolbox';
import { useSetterToolbox } from '../../hooks/useSetterToolbox';
import { useAuthToolbox } from '../../hooks/useAuthToolbox';
import { Search } from '../Search/Search';

export const Navbar = () => {
    const { logout } = useAuthToolbox();
    const { isAuthenticated, user } = useAppSelector(state => state.auth);
    const { useBooleanSetter, useListSetter } = useSetterToolbox();

    const menu = useBooleanSetter(false);
    const search = useBooleanSetter(false);
    const activity = useListSetter<string>([]);
    

    const trackAction = (msg: string) => {
        activity.addUnique(msg);
    };

    const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        trackAction('User Logout');
        logout();
        menu.setFalse();
    };

    const handleNavClick = (msg: string) => {
        trackAction(msg);
        menu.setFalse();
    };

    return (
        <nav className="navbar">
            <div className="navLogo">
                <Link to='/' onClick={() => handleNavClick('Clicked Logo')}>MyApp</Link>
            </div>

            <button className="menuBurger" onClick={menu.toggle}>
                {/* Changed to 'X' for better UX/Stability when open */}
                {menu.boolean ? '✕' : '☰'}
            </button>

            <ul className={`navLinks ${menu.boolean ? "open" : ''}`}>
                <li>
                    <Link to='/' onClick={() => handleNavClick('Nav to Home')}>Home</Link>
                </li>

                {isAuthenticated ? (
                    <>
                        {/* 1. Identity Section */}
                        <li className="navProfileHeader">
                            <div>
                                <p className="userName">{user?.username}</p>
                                <span className="userRole">{user?.is_admin}</span>
                            </div>
                        </li>

                        {/* 2. Explore Section */}
                        <div className="navSection">
                            <span className="sectionLabel">Explore</span>
                            <li><Link to='/universes' onClick={() => handleNavClick('Nav to Universes')}>Universes</Link></li>
                            <li><Link to='/notes' onClick={() => handleNavClick('Nav to Notes')}>Notes</Link></li>
                            <li><Link to='/locations' onClick={() => handleNavClick('Nav to Locations')}>Locations</Link></li>
                            <li><Link to='/characters' onClick={() => handleNavClick('Nav to Characters')}>Characters</Link></li>
                            <li><Link to='/dashboard' onClick={() => handleNavClick('Nav to Dash')}>Dashboard</Link></li>
                        </div>

                        {/* 3. Quick Tools Section */}
                        <div className="navSection">
                            <span className="sectionLabel">Quick Tools</span>
                            <li className="search">Search <Search onClose={search.setFalse}/></li>
                        
                            <li>
                                <button onClick={handleLogout} className="logoutBtn">
                                    Logout
                                </button>
                            </li>
                        </div>
                    </>
                ) : (
                    <>
                        <li><Link to='/login' onClick={() => menu.setFalse()}>Login</Link></li>
                        <li><Link to='/register' onClick={() => menu.setFalse()}>Register</Link></li>
                    </>
                )}
            </ul>

            <div className="activityDropdown">
                <span>Recent Activity ({activity.list.length})</span>
                <div className="dropdownContent">
                    {activity.list.map((item, i) => (
                        <p key={i} className="activityItem">
                            {new Date().toLocaleTimeString()} - {item}
                        </p>
                    ))}
                    {activity.list.length > 0 && (
                        <button className="clearBtn" onClick={activity.clear}>
                            Clear
                        </button>
                    )}
                </div>
            </div>

        </nav>
    );
};