import { GameFlowService } from './game-gateway.service';

describe('Session journal', () => {
    it('persists a server event and broadcasts it only to the host room', async () => {
        const event = { id: 'event', playerId: 'p', sessionId: 's', nickname: 'Учень', type: 'TAB_HIDDEN', createdAt: new Date() };
        const players = { addSessionEvent: jest.fn().mockResolvedValue(event) };
        const emit = jest.fn();
        const to = jest.fn(() => ({ emit }));
        const flow = new GameFlowService({} as any, players as any, {} as any, {} as any, {} as any, {} as any, { server: { to } } as any);
        await flow.logSessionEvent('p', 'TAB_HIDDEN');
        expect(players.addSessionEvent).toHaveBeenCalledWith('p', 'TAB_HIDDEN');
        expect(to).toHaveBeenCalledWith('host:s');
        expect(emit).toHaveBeenCalledWith('session_event', event);
    });
    it.each(['RUNNING', 'FINISHED'])('records disconnects only before completion (%s)', async (status) => {
        const players = { getBySocket: jest.fn().mockResolvedValue({ id: 'p', session_id: 's' }), addSessionEvent: jest.fn().mockResolvedValue(null) };
        const flow = new GameFlowService({} as any, players as any, { getById: async () => ({ status }) } as any, {} as any, {} as any, {} as any, {} as any);
        await flow.playerDisconnected({ id: 'socket' } as any);
        expect(players.getBySocket).toHaveBeenCalledWith('socket');
        expect(players.addSessionEvent).toHaveBeenCalledTimes(status === 'RUNNING' ? 1 : 0);
    });
});
