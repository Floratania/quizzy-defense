import TeacherRequestNotifications from './TeacherRequestNotifications.jsx';
import { Box, Button, Container, Group, Text } from "@mantine/core";
import { useNavigate } from "react-router";
import useAuth from "../../hooks/useAuth.js";
import React from "react";
import {IconSparkles} from "@tabler/icons-react";

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };

    return (
        <Box
            component="header"
            style={{
                flexShrink: 0,
                width: '100%',
                background: 'white',
                borderBottom: '1px solid #e0e7ff',
                padding: '0.75rem 1.5rem',
            }}
        >
            <Group justify="space-between" w="100%">
                <Group
                    gap="xs"
                    onClick={() => navigate('/')}
                    style={{ cursor: 'pointer' }}
                >
                    <Box
                        style={{
                            width: 32,
                            height: 32,
                            background: 'linear-gradient(135deg, #93c5fd 0%, #c084fc 100%)',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <IconSparkles size={24} style={{ color: 'yellow' }} />
                    </Box>

                    <Text size="xl" fw={600} style={{ color: '#1f2937' }}>
                        Quizzy
                    </Text>
                </Group>

                {user ? (
                    <Group gap="sm">
                        <TeacherRequestNotifications/>
                        <Button variant="subtle" color="gray" onClick={() => navigate(user.role === 'STUDENT' ? '/student' : '/admin')}>
                            Кабінет
                        </Button>
                        <Button variant="gradient" gradient={{ from: 'blue', to: 'violet' }} onClick={handleLogout}>
                            Вийти
                        </Button>
                    </Group>
                ) : (
                    <Button radius={10} variant="gradient" gradient={{ from: 'blue', to: 'violet' }} onClick={() => navigate('/auth')}>
                        Увійти
                    </Button>
                )}
            </Group>
        </Box>
    );
};

export default Navbar;