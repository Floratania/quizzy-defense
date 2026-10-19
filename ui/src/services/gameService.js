import {connectionService} from "../ws/connectionService.js";
import {socket} from "../ws/socket.js";


export const gameService = {
    async joinSession(data) {
        await connectionService.ensureConnected();
        socket.emit("join_session", data);
    },

    async hostJoin(sessionId) {
        await connectionService.ensureConnected();
        socket.emit("host_join_session", { sessionId });
    },

    async resumeSession(sessionId, playerId) {
        await connectionService.ensureConnected();
        socket.emit('resume_session', { sessionId, playerId, resumeToken:localStorage.getItem('resumeToken') });
    },

    async startGame(sessionId) {
        await connectionService.ensureConnected();
        socket.emit("start_game", { sessionId });
    },

    async nextQuestion(sessionId) {
        await connectionService.ensureConnected();
        socket.emit("next_question", { sessionId });
    },

    async submitAnswer(data) {
        await connectionService.ensureConnected();
        socket.emit("submit_answer", data);
    },
};
