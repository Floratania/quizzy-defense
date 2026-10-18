import {
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    Center,
    Container,
    Divider,
    Grid,
    Group,
    Loader,
    Paper,
    Stack,
    Text,
    Title,
    CopyButton,
} from "@mantine/core";
import { IconPlayerPlay, IconUsers, IconCopy } from "@tabler/icons-react";
import React from "react";
import { QRCodeSVG } from 'qrcode.react';

export default function PlayersList({ players, sessionId, startGame, roomCode, mode, teams = [], teamAssignment = 'AUTO' }) {
    const isTeamGame = mode === 'TEAM' || mode === 'TOURNAMENT';
    const usesTeamCodes = isTeamGame && teamAssignment === 'CODES';
    const joinLink = (code) => `${window.location.origin}/join?code=${encodeURIComponent(code || '')}`;

    return (
        <Box
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)",
                padding: "2rem",
            }}
        >
            <Container size="lg">
                <Paper shadow="lg" radius="xl" p="xl" style={{ background: "white" }}>
                    <Stack spacing="xl">

                        {/* ROOM CODE BLOCK */}
                        <Center>
                            <Stack spacing="xs" align="center">
                                <Text size="lg" weight={600} color="dimmed">
                                    {usesTeamCodes ? 'Коди для приєднання до команд' : 'Приєднуйтесь за кодом'}
                                </Text>

                                {!usesTeamCodes && <Group spacing="xs">
                                    <Paper p="sm" withBorder><QRCodeSVG value={joinLink(roomCode)} size={150} level="M" /></Paper>
                                    <Badge
                                        size="xl"
                                        radius="md"
                                        color="violet"
                                        variant="filled"
                                        style={{ fontSize: "1.8rem", padding: "1rem 1.4rem" }}
                                    >
                                        {roomCode || "------"}
                                    </Badge>

                                    <CopyButton value={roomCode || ""}>
                                        {({ copied, copy }) => (
                                            <Button
                                                variant="light"
                                                size="md"
                                                color={copied ? "green" : "violet"}
                                                leftSection={<IconCopy size={16} />}
                                                onClick={copy}
                                            >
                                                {copied ? "Скопійовано!" : "Копіювати"}
                                            </Button>
                                        )}
                                    </CopyButton>
                                </Group>}

                                {usesTeamCodes && (
                                    <Grid w="100%" mt="sm">
                                        {teams.map((team) => (
                                            <Grid.Col key={team.id} span={{ base: 12, sm: 6 }}>
                                                <Paper withBorder radius="md" p="md">
                                                    <Group justify="space-between">
                                                        <QRCodeSVG value={joinLink(team.joinCode)} size={92} level="M" />
                                                        <div>
                                                            <Text size="sm" c="dimmed">{team.name}</Text>
                                                            <Text fw={800} size="xl">{team.joinCode}</Text>
                                                        </div>
                                                        <CopyButton value={team.joinCode || ''}>
                                                            {({ copied, copy }) => (
                                                                <Button variant="light" color={copied ? 'green' : 'violet'} onClick={copy}>
                                                                    {copied ? 'Скопійовано' : 'Копіювати'}
                                                                </Button>
                                                            )}
                                                        </CopyButton>
                                                    </Group>
                                                </Paper>
                                            </Grid.Col>
                                        ))}
                                    </Grid>
                                )}

                                <Text color="dimmed" size="sm" ta="center">
                                    Гравці приєднуються тут:<br/>
                                    <strong>{joinLink(roomCode)}</strong>
                                </Text>
                            </Stack>
                        </Center>

                        <Divider />

                        {/* HEADER */}
                        <Group position="apart">
                            <div>
                                <Title order={2}>Очікування гравців</Title>
                                <Text color="dimmed" size="sm">
                                    ID Сесії: {sessionId || "Завантаження..."}
                                </Text>
                            </div>

                            <Badge
                                size="xl"
                                variant="gradient"
                                gradient={{ from: "blue.4", to: "purple.4" }}
                                leftSection={<IconUsers size={16} />}
                            >
                                {players?.length} Гравців
                            </Badge>
                        </Group>

                        {/* PLAYERS GRID */}
                        <Grid>
                            {players?.map((player, idx) => (
                                <Grid.Col key={player.id} span={6} md={4} lg={3}>
                                    <Card shadow="sm" radius="lg" p="md">
                                        <Stack spacing="xs" align="center">
                                            <Avatar
                                                size="lg"
                                                radius="xl"
                                                color={["blue", "violet", "pink", "cyan"][idx % 4]}
                                            >
                                                {player.nickname[0].toUpperCase()}
                                            </Avatar>

                                            <Text weight={600} size="sm" align="center">
                                                {player.nickname}
                                            </Text>
                                            {isTeamGame && <Badge color="violet" variant="light">{player.teamName || 'Команда'}</Badge>}
                                            <Badge size="sm" color={player.integrityEvents ? 'orange' : 'gray'} variant="light">Виходи з вкладки: {player.integrityEvents || 0}</Badge>
                                            {player.eliminated && <Badge color="red" variant="light">Вибув</Badge>}
                                        </Stack>
                                    </Card>
                                </Grid.Col>
                            ))}
                        </Grid>

                        {/* EMPTY STATE */}
                        {players?.length === 0 && (
                            <Center py="xl">
                                <Stack spacing="sm" align="center">
                                    <Loader variant="dots" size="lg" />
                                    <Text color="dimmed">Очікуємо приєднання гравців...</Text>
                                </Stack>
                            </Center>
                        )}

                        {/* START BUTTON */}
                        <Button
                            size="lg"
                            radius="lg"
                            variant="gradient"
                            gradient={{ from: "blue", to: "violet" }}
                            leftSection={<IconPlayerPlay size={20} />}
                            onClick={startGame}
                            disabled={players?.length === 0}
                            fullWidth
                        >
                            Розпочати гру
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
