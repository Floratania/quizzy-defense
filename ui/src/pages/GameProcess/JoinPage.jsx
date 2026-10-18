import React, {useEffect, useState} from "react";
import {
    Container,
    Paper,
    Title,
    Text,
    TextInput,
    Button,
    Stack,
    Box,
} from "@mantine/core";
import {IconHash, IconUser, IconLogin} from "@tabler/icons-react";
import {useNavigate, useSearchParams} from "react-router";
import {notifications} from "@mantine/notifications";
import {socket} from "../../ws/socket.js";
import {gameService} from "../../services/gameService.js";
import {useAuthContext} from '../../context/AuthContext.jsx';

export default function JoinPage() {
    const [searchParams] = useSearchParams();
    const [roomCode, setRoomCode] = useState(searchParams.get('code') || "");
    const [nickname, setNickname] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const {user} = useAuthContext();
    useEffect(()=>{if(user?.name)setNickname(current=>current||user.name);},[user?.name]);
    const savedSessionId = localStorage.getItem('sessionId');
    const savedPlayerId = localStorage.getItem('playerId');

    // --- SOCKET LISTENERS ---
    useEffect(() => {
        const onSuccess = (data) => {
            setLoading(false);
            localStorage.setItem("sessionId", data.sessionId);
            localStorage.setItem("playerId", data.playerId);
            localStorage.setItem('resumeToken',data.resumeToken);
            localStorage.setItem("nickname", nickname);
            if (data.teamName) localStorage.setItem("teamName", data.teamName);

            navigate("/player");
        };

        const onError = (msg) => {
            setLoading(false);
            notifications.show({
                title: "Помилка",
                message: msg,
                color: "red",
            });
        };

        socket.on("joined_successfully", onSuccess);
        socket.on("join_error", onError);

        return () => {
            socket.off("joined_successfully", onSuccess);
            socket.off("join_error", onError);
        };
    }, [nickname, navigate]);

    // --- JOIN HANDLER ---
    const handleJoin = async () => {
        if (!roomCode.trim() || !nickname.trim()) {
            notifications.show({
                title: "Дані не заповнені",
                message: "Введіть код кімнати та нікнейм",
                color: "red",
            });
            return;
        }

        setLoading(true);
        try {
            await gameService.joinSession({roomCode, nickname, ...(user?.id ? { studentId: user.id } : {})});
        } catch (error) {
            setLoading(false);
            notifications.show({title: 'Помилка підключення', message: error.message, color: 'red'});
        }
    };

    // Submit on Enter
    const handleKeyPress = (e) => {
        if (e.key === "Enter") handleJoin();
    };

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
            <Container size={480}>
                <Stack spacing="xl" align="center">
                    <Paper
                        shadow="xl"
                        radius="xl"
                        p={40}
                        style={{
                            width: "100%",
                            background: "white",
                            border: "1px solid #e0e7ff"
                        }}
                    >
                        <Stack spacing="lg">
                            {savedSessionId && savedPlayerId && (
                                <Paper withBorder radius="md" p="md" style={{ background: '#ecfdf5' }}>
                                    <Text fw={600} c="teal" mb="xs">Знайдено незавершене проходження</Text>
                                    <Button color="teal" fullWidth onClick={() => navigate('/player')}>Продовжити попередню сесію</Button>
                                </Paper>
                            )}
                            <div style={{textAlign: "center"}}>
                                <Title order={2} style={{color: "#1f2937", marginBottom: 8}}>
                                    Приєднатися до гри
                                </Title>
                                <Text color="dimmed" size="sm">
                                    Введіть код кімнати та нікнейм, щоб розпочати гру
                                </Text>
                            </div>

                            <Stack spacing="md">
                                <TextInput
                                    size="lg"
                                    placeholder="Введіть код кімнати"
                                    icon={<IconHash size={20}/>}
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    radius="lg"
                                    styles={{
                                        input: {
                                            border: "2px solid #e5e7eb",
                                            "&:focus": {borderColor: "#93c5fd"}
                                        }
                                    }}
                                />

                                <TextInput
                                    size="lg"
                                    placeholder="Введіть нікнейм"
                                    icon={<IconUser size={20}/>}
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    radius="lg"
                                    styles={{
                                        input: {
                                            border: "2px solid #e5e7eb",
                                            "&:focus": {borderColor: "#93c5fd"}
                                        }
                                    }}
                                />
                            </Stack>

                            <Button
                                size="lg"
                                radius="lg"
                                variant="gradient"
                                gradient={{from: "blue", to: "violet"}}
                                leftSection={<IconLogin size={20}/>}
                                onClick={handleJoin}
                                loading={loading}
                                disabled={!roomCode.trim() || !nickname.trim()}
                                fullWidth
                                style={{marginTop: 8}}
                            >
                                Приєднатися до гри
                            </Button>

                        </Stack>
                    </Paper>
                </Stack>
            </Container>
        </Box>
    );
}
