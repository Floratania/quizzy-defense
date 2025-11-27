import {Box, Card, Center, Container, Grid, Text, Title} from "@mantine/core";

const FeatureCard = ({ emoji, title, description, gradient }) => (
    <Card
        shadow="sm"
        padding="xl"
        radius="lg"
        withBorder
        style={{
            height: "100%",                   // ключове
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            textAlign: "center",
        }}
    >
        <Center>
            <Box
                style={{
                    width: 48,
                    height: 48,
                    background: gradient,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    marginBottom: 16
                }}
            >
                {emoji}
            </Box>
        </Center>

        <Title order={3} size="h4" mb="xs">
            {title}
        </Title>

        <Text c="dimmed">
            {description}
        </Text>
    </Card>
);


const Features = () => {
    return (
        <Box
            style={{
                minHeight: "80vh",
                display: "flex",
                alignItems: "center",
                paddingBottom: "4rem",
            }}
        >
            <Container size="lg">
                {/* --- SECTION HEADER --- */}
                <Center mb="xl">
                    <Box>
                        <Title
                            order={2}
                            ta="center"
                            style={{
                                fontSize: 36,
                                background: "linear-gradient(135deg, #3b82f6, #a855f7)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                marginBottom: 8,
                            }}
                        >
                            Why Quizzy?
                        </Title>

                        <Text ta="center" c="dimmed" size="lg" maw={600} mx="auto">
                            Fast, interactive, and made for real-time fun — whether you're studying,
                            hosting an event, or playing with friends.
                        </Text>
                    </Box>
                </Center>

                {/* --- CARDS --- */}
                <Grid gutter="xl">
                    <Grid.Col span={{base: 12, md: 4}}>
                        <FeatureCard
                            emoji="⚡"
                            title="Real-time play"
                            description="Compete instantly. Zero delays, pure excitement."
                            gradient="linear-gradient(135deg, #64b5f6 0%, #42a5f5 100%)"
                        />
                    </Grid.Col>

                    <Grid.Col span={{base: 12, md: 4}}>
                        <FeatureCard
                            emoji="📊"
                            title="Live results"
                            description="See rankings update with every answer."
                            gradient="linear-gradient(135deg, #ba68c8 0%, #ab47bc 100%)"
                        />
                    </Grid.Col>

                    <Grid.Col span={{base: 12, md: 4}}>
                        <FeatureCard
                            emoji="🎯"
                            title="Simple to use"
                            description="Create a quiz and share it in seconds."
                            gradient="linear-gradient(135deg, #f06292 0%, #ec407a 100%)"
                        />
                    </Grid.Col>
                </Grid>
            </Container>
        </Box>
    );
};

export default Features;
