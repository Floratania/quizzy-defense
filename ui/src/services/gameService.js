import {connectionService} from "../ws/connectionService.js";
import {socket} from "../ws/socket.js";


export const gameService = {
    async joinSession(data) {
        await connectionService.ensureConnected();
        socket.emit("join_session", data);
    },

    hostJoin(sessionId) {
        connectionService.ensureConnected();
        socket.emit("host_join_session", { sessionId });
    },

    resumeSession(sessionId, playerId) {
        connectionService.ensureConnected();
        socket.emit('resume_session', { sessionId, playerId, resumeToken:localStorage.getItem('resumeToken') });
    },

    startGame(sessionId) {
        connectionService.ensureConnected();
        socket.emit("start_game", { sessionId });
    },

    nextQuestion(sessionId) {
        connectionService.ensureConnected();
        socket.emit("next_question", { sessionId });
    },

    submitAnswer(data) {
        connectionService.ensureConnected();
        socket.emit("submit_answer", data);
    },
};
