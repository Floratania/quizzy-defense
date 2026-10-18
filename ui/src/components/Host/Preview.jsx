import {Badge, Box, Container, Image, Paper, Stack, Text} from "@mantine/core";
import React from "react";
import RichText from '../Question/RichText.jsx';

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
                        {preview.mediaUrl && <Image src={preview.mediaUrl} alt={preview.text} radius="md" mah={320} fit="contain" />}
                        <Badge
                            size="lg"
                            variant="gradient"
                            gradient={{ from: "blue.3", to: "purple.3" }}
                        >
                            Приготуйтесь!
                        </Badge>
                        <div style={{ fontSize: "1.5rem", color: "#1f2937" }}>
                            <RichText>{preview.text}</RichText>
                        </div>
                        <Text size="lg" color="dimmed">
                            Питання скоро розпочнеться...
                        </Text>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
