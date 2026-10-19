import {tournamentBoundaries} from '../game-sessions/tournament-plan';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionTeam } from './entities/session-team.entity';
import { GameSession } from '../game-sessions/entities/game-session.entity';

@Injectable()
export class GameTeamsService {
    constructor(@InjectRepository(SessionTeam) private readonly teamsRepo: Repository<SessionTeam>,
        @InjectRepository(GameSession) private readonly sessionsRepo: Repository<GameSession>) {}

    async createForSession(sessionId: string, count: number, names?: string[], roomCode?: string, useTeamCodes = false) {
        const safeCount = Math.max(2, Math.min(count, 8));
        const teams = Array.from({ length: safeCount }, (_, index) => this.teamsRepo.create({
            sessionId,
            name: names?.[index]?.trim() || `Команда ${index + 1}`,
            position: index,
            joinCode: useTeamCodes && roomCode ? `${roomCode}${index + 1}` : null,
        }));
        return this.teamsRepo.save(teams);
    }

    async getLeaderboard(sessionId: string) {
        const teams = await this.teamsRepo.find({
            where: { sessionId },
            relations: ['players'],
            order: { position: 'ASC' },
        });
        return teams
            .map((team) => ({
                id: team.id,
                nickname: team.name,
                name: team.name,
                isTeam: true,
                totalScore: team.players.reduce((sum, player) => sum + player.totalScore, 0),
                members: team.players.map((player) => ({ id: player.id, nickname: player.nickname })),
            }))
            .sort((a, b) => b.totalScore - a.totalScore);
    }

    async getTournamentState(sessionId: string, questionIndex: number, totalQuestions: number) {
        const leaderboard = await this.getLeaderboard(sessionId);
        const session = await this.sessionsRepo.findOneByOrFail({id: sessionId});
        const {qualificationEnd,semifinalEnd} = tournamentBoundaries(session.settings,totalQuestions);
        const stage = questionIndex < qualificationEnd
            ? 'QUALIFICATION'
            : questionIndex < semifinalEnd ? 'SEMIFINAL' : 'FINAL';
        type Bracket = { ids: string[]; baseline: Record<string, number> };
        const brackets = (session.settings.tournamentBrackets || {}) as Record<string, Bracket>;
        const rank = (ids: string[], baseline: Record<string, number>) => ids.map(id => leaderboard.find(team => team.id === id)!)
            .filter(Boolean).sort((a,b) => (b.totalScore - (baseline[b.id] || 0)) - (a.totalScore - (baseline[a.id] || 0)) || a.id.localeCompare(b.id));
        if (!brackets.QUALIFICATION) brackets.QUALIFICATION = {ids: leaderboard.map(team => team.id), baseline: {}};
        if (stage !== 'QUALIFICATION' && !brackets.SEMIFINAL) {
            brackets.SEMIFINAL = {ids: rank(brackets.QUALIFICATION.ids, {}).slice(0,4).map(team => team.id), baseline: Object.fromEntries(leaderboard.map(team => [team.id, team.totalScore]))};
        }
        if (stage === 'FINAL' && !brackets.FINAL) {
            const semi = brackets.SEMIFINAL;
            const winners = Array.from({length: Math.floor(semi.ids.length / 2)}, (_,index) =>
                rank([semi.ids[index], semi.ids[semi.ids.length - 1 - index]], semi.baseline)[0].id);
            brackets.FINAL = {ids: winners, baseline: Object.fromEntries(leaderboard.map(team => [team.id, team.totalScore]))};
        }
        session.settings = {...session.settings, tournamentBrackets: brackets};
        await this.sessionsRepo.save(session);
        const current = brackets[stage];
        const activeTeams = current.ids.map(id => leaderboard.find(team => team.id === id)!).filter(Boolean);
        const matches = Array.from({ length: Math.ceil(activeTeams.length / 2) }, (_, index) => ({
            id: `${stage}-${index + 1}`,
            home: activeTeams[index],
            away: activeTeams[activeTeams.length - 1 - index],
        })).filter((match) => match.home && match.away && match.home.id !== match.away.id);
        return {
            stage,
            questionIndex: questionIndex + 1,
            totalQuestions,
            qualificationEnd,
            semifinalEnd,
            stageQuestionIndex: questionIndex - (stage === 'FINAL' ? semifinalEnd : stage === 'SEMIFINAL' ? qualificationEnd : 0) + 1,
            stageQuestionCount: stage === 'FINAL' ? totalQuestions - semifinalEnd : stage === 'SEMIFINAL' ? semifinalEnd - qualificationEnd : qualificationEnd,
            activeTeamIds: activeTeams.map((team) => team.id),
            leaderboard,
            matches,
            champion: questionIndex >= totalQuestions ? rank(current.ids, current.baseline)[0] ?? null : null,
        };
    }
}
