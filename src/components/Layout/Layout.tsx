
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
            <Sidebar />
            <div style={{ marginLeft: '250px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header />
                <main style={{ flex: 1, padding: '2rem' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
