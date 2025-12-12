import React from 'react';
import { Box, Container, Paper, Title, Text, Stack, ThemeIcon } from '@mantine/core';
import { IconBolt } from '@tabler/icons-react';

export const PreviewScreen = () => {
    return (
        <Box
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
            }}
        >
            <Container size="md">
                <Paper
                    shadow="xl"
                    radius="xl"
                    p={60}
                    style={{
                        background: "white",
                        textAlign: "center",
                    }}
                >
                    <Stack spacing="xl" align="center">
                        <ThemeIcon
                            size={80}
                            radius="xl"
                            variant="gradient"
                            gradient={{ from: 'blue.4', to: 'purple.4' }}
                        >
                            <IconBolt size={40} />
                        </ThemeIcon>

                        <Title
                            order={1}
                            style={{ fontSize: '3rem', color: '#1f2937' }}
                        >
                            Get Ready!
                        </Title>

                        <Text size="xl" c="dimmed">
                            Next question is starting...
                        </Text>

                        <div style={{ width: '100%', maxWidth: 300 }}>
                            <Box
                                style={{
                                    height: 4,
                                    background: '#e5e7eb',
                                    borderRadius: 999,
                                    overflow: 'hidden',
                                }}
                            >
                                <Box
                                    style={{
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #93c5fd 0%, #c084fc 100%)',
                                        animation: 'pulse 1.5s ease-in-out infinite',
                                    }}
                                />
                            </Box>
                        </div>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
};
