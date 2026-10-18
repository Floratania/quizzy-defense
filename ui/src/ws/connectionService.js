import {socket} from "./socket";

export const connectionService = {
    ensureConnected() {
        return new Promise((resolve, reject) => {
            if (socket.connected) return resolve();
            const cleanup = () => { clearTimeout(timer); socket.off('connect', connected); socket.off('connect_error', failed); };
            const connected = () => { cleanup(); resolve(); };
            const failed = () => { cleanup(); reject(new Error('Не вдалося підключитися до сервера гри')); };
            const timer = setTimeout(failed, 10000);
            socket.once('connect', connected);
            socket.once('connect_error', failed);
            socket.connect();
        });
    },

    disconnect() {
        if (socket.connected) {
            socket.disconnect();
        }
    },
};
