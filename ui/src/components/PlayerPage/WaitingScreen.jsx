// WaitingScreen.js
import React from 'react';
import { Box, Container, Paper, Title, Text, Stack, Avatar, Loader } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';

export const WaitingScreen = ({ nickname }) => {
    return (
        <Box
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem"
            }}
        >
            <Container size="md">
                <Paper
                    shadow="xl"
                    radius="xl"
                    p={60}
                    style={{ background: "white", textAlign: "center" }}
                >
                    <Stack spacing="xl" align="center">
                        <Avatar
                            size={100}
                            radius="xl"
                            color="blue"
                            variant="gradient"
                            gradient={{ from: 'blue.3', to: 'purple.3' }}
                        >
                            {nickname?.[0]?.toUpperCase() || 'P'}
                        </Avatar>

                        <div>
                            <Title order={2} mb="xs" style={{ color: '#1f2937' }}>
                                Welcome, {nickname}!
                            </Title>
                            <Text size="lg" c="dimmed">
                                Waiting for the game to start...
                            </Text>
                        </div>

                        <Loader size="lg" variant="dots" color="blue.3" />

                        <Paper p="md" radius="lg" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #e9d5ff 100%)' }}>
                            <Stack spacing="xs" align="center">
                                <IconSparkles size={24} color="#60a5fa" />
                                <Text size="sm" fw={500}>
                                    Get ready to show what you know!
                                </Text>
                            </Stack>
                        </Paper>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
};
