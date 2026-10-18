const key = (sessionId, playerId) => `quizzy:final-result:${sessionId}:${playerId}`;

export function readFinalResult(sessionId, playerId) {
    if (!sessionId || !playerId) return null;
    try { return JSON.parse(sessionStorage.getItem(key(sessionId, playerId)) || 'null'); }
    catch { return null; }
}

export function saveFinalResult(sessionId, playerId, result) {
    if (!sessionId || !playerId || !result) return;
    try { sessionStorage.setItem(key(sessionId, playerId), JSON.stringify(result)); }
    catch { /* The server can return the result again through the scoped resume flow. */ }
}
