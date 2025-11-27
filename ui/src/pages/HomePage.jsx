import {Box} from "@mantine/core";
import Hero from "../components/HomePage/Hero.jsx";
import Features from "../components/HomePage/Features.jsx";

const HomePage = () => {
    return (
        <Box
            style={{
                minHeight: '100%',
                background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 50%, #fce4ec 100%)'
            }}
        >
            <Hero/>
            <Features/>
        </Box>
    );
};

export default HomePage;
