import { io } from "socket.io-client";

let connectedToken;
export const getSocketAuthToken=()=>connectedToken;

export const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
    autoConnect: false,
    auth: (callback) => { connectedToken=localStorage.getItem('accessToken') || undefined;callback({token:connectedToken}); },
    transports: ["websocket"],
});
