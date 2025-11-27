import {
    MantineProvider, Box,
} from '@mantine/core';
import {Outlet} from 'react-router-dom';
import {AdminSidebar} from "../components/Dashboard/DashboardLayout/AdminSidebar/AdminSidebar.jsx";

export default function AdminDashboard() {
    return (<MantineProvider
        theme={{
            colorScheme: 'light', primaryColor: 'blue',
        }}
    >
        <DashboardContent/>
    </MantineProvider>);
}

function DashboardContent() {

    return (<Box
        style={{
            display: 'grid', gridTemplateColumns: '80px 1fr', width: '100%', minHeight: '100vh', gap: '3rem',
        }}
    >
        <Box style={{
            padding: '2rem',
        }}>
            <AdminSidebar/>
        </Box>

        <Box style={{ padding: '2rem'}}>
            <Box sx={{width: '100%', maxWidth: 1200}}>
                <Outlet/>
            </Box>
        </Box>
    </Box>);
}
