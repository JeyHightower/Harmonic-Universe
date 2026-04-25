import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar/Navbar';

export const Layout = () => {
    return (

        <>
            <nav> <Navbar /> </nav>
            <main> <Outlet/> </main>
        </>
    )
}