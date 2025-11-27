import {socket} from "./socket";

export const connectionService = {
    ensureConnected() {
        return new Promise((resolve) => {
            if (socket.connected) return resolve();

            socket.connect();
            socket.on("connect", resolve);
        });
    },

    disconnect() {
        if (socket.connected) {
            socket.disconnect();
        }
    },
};
