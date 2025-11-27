import {Badge, Button, Box, Container, Group, Stack, Text, Title} from "@mantine/core";
import {IconArrowRight, IconSparkles} from "@tabler/icons-react";
import {useNavigate} from "react-router";
import {useAuthContext} from "../../context/AuthContext.jsx";
import useAuth from "../../hooks/useAuth.js";

const Hero = () => {
    const navigate = useNavigate();
    const {user} = useAuth();

    return (
        <Box style={{minHeight: 'calc(100vh - 70px)', display: "flex", alignItems: "center"}}>
            <Container size="lg">
                <Stack align="center" gap="xl">

                    <Badge
                        size="lg"
                        variant="light"
                        leftSection={<IconSparkles size={16}/>}
                        style={{border: "1px solid #e3f2fd"}}
                    >
                        Live quiz platform
                    </Badge>

                    <Title
                        order={1}
                        size={64}
                        ta="center"
                        style={{
                            background: "linear-gradient(135deg, #1e88e5 0%, #ab47bc 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            lineHeight: 1.2,
                        }}
                    >
                        Quiz together,<br/>learn better
                    </Title>

                    <Text size="xl" c="dimmed" ta="center" maw={600}>
                        Create engaging quizzes and play with friends in real-time. Simple, fast, and fun.
                    </Text>

                    <Group>
                        <Button
                            size="lg"
                            variant="gradient"
                            gradient={{from: "blue", to: "violet"}}
                            rightSection={<IconArrowRight size={20}/>}
                            onClick={() => navigate("join")}
                        >
                            Join Room
                        </Button>

                        <Button size="lg" variant="default" onClick={() => {
                            if (user) navigate("dashboard")
                            else navigate("auth")
                        }}>
                            Get started
                        </Button>
                    </Group>

                </Stack>
            </Container>
        </Box>
    );
};

export default Hero;
