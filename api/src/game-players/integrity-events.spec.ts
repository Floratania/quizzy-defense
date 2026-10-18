import { GamePlayersService } from './game-players.service';

describe('Live tab switch tracking', () => {
    it('counts duplicate hidden events once and counts the next exit after return', async () => {
        let count = 0;
        const repo = { findOne: jest.fn().mockResolvedValue({ id: 'p', session_id: 's', session: { status: 'RUNNING', settings: { trackTabSwitches: true } } }), increment: jest.fn(async () => { count++; }), findOneBy: jest.fn(async () => ({ integrityEvents: count })) };
        const service = new GamePlayersService(repo as any, {} as any, {} as any);
        await Promise.all([service.recordIntegrityEvent('socket', true), service.recordIntegrityEvent('socket', true)]);
        expect(count).toBe(1);
        await service.recordIntegrityEvent('socket', false);
        await service.recordIntegrityEvent('socket', false);
        expect(count).toBe(1);
        expect(await service.recordIntegrityEvent('socket', true)).toMatchObject({ integrityEvents: 2 });
    });
    it('uses the connected socket and returns the persisted count', async () => {
        const repo = { findOne: jest.fn().mockResolvedValue({ id: 'p', session_id: 's', session: { status: 'RUNNING', settings: { trackTabSwitches: true } } }), increment: jest.fn(), findOneBy: jest.fn().mockResolvedValue({ integrityEvents: 4 }) };
        const service = new GamePlayersService(repo as any, {} as any, {} as any);
        expect(await service.recordIntegrityEvent('socket')).toEqual({ playerId: 'p', sessionId: 's', integrityEvents: 4 });
        expect(repo.findOne).toHaveBeenCalledWith({ where: { socketId: 'socket' }, relations: ['session'] });
        expect(repo.increment).toHaveBeenCalledWith({ id: 'p' }, 'integrityEvents', 1);
    });

    it.each([
        null,
        { session: { status: 'WAITING', settings: { trackTabSwitches: true } } },
        { session: { status: 'RUNNING', settings: { trackTabSwitches: false } } },
        { completedAt: new Date(), session: { status: 'RUNNING', settings: { trackTabSwitches: true } } },
        { eliminatedAt: new Date(), session: { status: 'RUNNING', settings: { trackTabSwitches: true } } },
    ])('ignores unknown, inactive or untracked participants (%#)', async (player) => {
        const repo = { findOne: jest.fn().mockResolvedValue(player), increment: jest.fn() };
        const service = new GamePlayersService(repo as any, {} as any, {} as any);
        expect(await service.recordIntegrityEvent('socket')).toBeNull();
        expect(repo.increment).not.toHaveBeenCalled();
    });
});
