import {Box, Stack, Text} from "@mantine/core";

export default function LoaderPage () {
    return (
        <Box
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}
        >
            <Stack spacing="md" align="center">
                <LoaderPage size="xl" variant="dots" color="blue.3"/>
                <Text size="lg" color="dimmed">
                    Initializing game...
                </Text>
            </Stack>
        </Box>
    );
}