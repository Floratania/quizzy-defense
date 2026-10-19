import {MigrationInterface,QueryRunner} from 'typeorm';
export class IndependentRefreshSessions1760000029000 implements MigrationInterface {
 async up(q:QueryRunner){const table=await q.getTable('refresh_token');if(!table)throw new Error('Refresh token table missing');for(const unique of table.uniques.filter(u=>u.columnNames.length===1&&u.columnNames[0]==='userId'))await q.dropUniqueConstraint(table,unique);}
 async down(){ /* Independent sessions cannot be merged safely during rollback. */ }
}
