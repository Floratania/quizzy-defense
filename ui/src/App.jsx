import {AuthProvider} from "./context/AuthContext.jsx";
import Navbar from "./components/Layout/Navbar.jsx";
import {Box} from "@mantine/core";
import Footer from "./components/Layout/Footer.jsx";
import {Outlet} from "react-router-dom";

export default function App() {
    return (
        <AuthProvider>
            <Box
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100vh',
                }}
            >
                    <Navbar />

                <Box component="main" style={{ flex: 1, background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 50%, #fce4ec 100%)'}} >
                    <Outlet />
                </Box>

                    <Footer />
            </Box>
        </AuthProvider>
    );
}
