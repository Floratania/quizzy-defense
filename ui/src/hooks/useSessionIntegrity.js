import { useEffect } from 'react';
import { socket } from '../ws/socket.js';
import { connectionService } from '../ws/connectionService.js';

export function useSessionIntegrity({ enabled, finished, sessionId, playerId }) {
    useEffect(() => {
        if (!enabled || finished || !sessionId || !playerId) return;
        const key = `quizzy:integrity-pending:${sessionId}:${playerId}`;
        let pending = [];
        try { pending = JSON.parse(sessionStorage.getItem(key) || '[]'); } catch { /* unavailable storage */ }
        if (!Array.isArray(pending)) pending = [];
        pending = pending.filter((event) => event && event.reason !== 'blur');
        let ready = false;
        let away = false;
        const persist = () => { try { sessionStorage.setItem(key, JSON.stringify(pending.slice(-40))); } catch { /* best effort */ } };
        const report = (hidden, reason) => {
            if (away === hidden) return;
            away = hidden;
            const event = { hidden, reason };
            if (ready && socket.connected) socket.emit('integrity_event', event);
            else { pending.push(event); persist(); }
        };
        const flush = () => {
            ready = true;
            pending.splice(0).forEach((event) => socket.emit('integrity_event', event));
            persist();
        };
        const disconnect = () => { ready = false; };
        const visibility = () => {
            report(document.hidden, 'visibility');
            if (!document.hidden && !socket.connected) connectionService.ensureConnected().catch(() => {});
        };
        const hide = () => report(true, 'pagehide');
        const show = visibility;
        document.addEventListener('visibilitychange', visibility);
        window.addEventListener('pagehide', hide);
        window.addEventListener('pageshow', show);
        socket.on('session_resumed', flush);
        socket.on('question_started', flush);
        socket.on('disconnect', disconnect);
        // The hook may mount after the initial resume, so confirm the scoped player session before flushing.
        if (socket.connected) socket.emit('resume_session', { sessionId, playerId, resumeToken: localStorage.getItem('resumeToken') });
        return () => {
            document.removeEventListener('visibilitychange', visibility);
            window.removeEventListener('pagehide', hide); window.removeEventListener('pageshow', show);
            socket.off('session_resumed', flush); socket.off('question_started', flush); socket.off('disconnect', disconnect);
        };
    }, [enabled, finished, sessionId, playerId]);
}
