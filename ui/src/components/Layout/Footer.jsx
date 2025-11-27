import { Anchor, Box, Container, Group, Text } from "@mantine/core";
import React from "react";

const Footer = () => {
    return (
        <Box
            style={{
                background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                padding: '2rem 0',
                marginTop: 'auto',
                borderTop: '1px solid #e0e7ff'
            }}
        >
            <Container size="xl">
                <Group justify="space-between" align="center">
                    <Group gap="xs">
                        <Box
                            style={{
                                width: 24,
                                height: 24,
                                background: 'linear-gradient(135deg, #93c5fd 0%, #c084fc 100%)',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Text size="sm" fw={700} style={{ color: 'white' }}>
                                Q
                            </Text>
                        </Box>
                        <Text size="sm" c="dimmed">
                            © 2024 QuizBolt. All rights reserved.
                        </Text>
                    </Group>
                    <Group gap="xl">
                        <Anchor
                            href="#"
                            c="dimmed"
                            size="sm"
                            underline="never"
                            style={{ transition: 'color 0.2s' }}
                            styles={{
                                root: {
                                    '&:hover': {
                                        color: '#60a5fa'
                                    }
                                }
                            }}
                        >
                            Privacy Policy
                        </Anchor>
                        <Anchor
                            href="#"
                            c="dimmed"
                            size="sm"
                            underline="never"
                            style={{ transition: 'color 0.2s' }}
                            styles={{
                                root: {
                                    '&:hover': {
                                        color: '#60a5fa'
                                    }
                                }
                            }}
                        >
                            Terms of Service
                        </Anchor>
                        <Anchor
                            href="#"
                            c="dimmed"
                            size="sm"
                            underline="never"
                            style={{ transition: 'color 0.2s' }}
                            styles={{
                                root: {
                                    '&:hover': {
                                        color: '#60a5fa'
                                    }
                                }
                            }}
                        >
                            Contact
                        </Anchor>
                    </Group>
                </Group>
            </Container>
        </Box>
    );
};

export default Footer;