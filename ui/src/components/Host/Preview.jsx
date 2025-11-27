import {Badge, Box, Container, Paper, Stack, Text, Title} from "@mantine/core";
import React from "react";

export default function Preview({preview}) {
    return (
        <Box
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)",
                padding: "2rem",
                display: "flex",
                alignItems: "center"
            }}
        >
            <Container size="md">
                <Paper
                    shadow="xl"
                    radius="xl"
                    p={60}
                    style={{ background: "white", textAlign: "center" }}
                >
                    <Stack spacing="xl">
                        <Badge
                            size="lg"
                            variant="gradient"
                            gradient={{ from: "blue.3", to: "purple.3" }}
                        >
                            Get Ready!
                        </Badge>
                        <Title order={1} style={{ fontSize: "3rem", color: "#1f2937" }}>
                            {preview.text}
                        </Title>
                        <Text size="lg" color="dimmed">
                            Question starting soon...
                        </Text>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}