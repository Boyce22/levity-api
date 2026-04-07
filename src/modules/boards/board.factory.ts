import pino from 'pino';
import { AppDataSource } from '@config';
import { List } from './entities/list.entity';
import { Card } from './entities/card.entity';
import { CardHistory } from './entities/card-history.entity';
import { ListRepository } from './repositories/list.repository';
import { CardRepository } from './repositories/card.repository';
import { CardHistoryRepository } from './repositories/card-history.repository';
import { BoardService } from './services/board.service';
import { BoardController } from './controllers/board.controller';
import { memberRepository, workspaceRepository } from '@/modules/workspaces/workspace.factory';

const logger = pino({ name: 'boards' });

export const listRepository = new ListRepository(AppDataSource.getRepository(List));
export const cardRepository = new CardRepository(AppDataSource.getRepository(Card));
export const cardHistoryRepository = new CardHistoryRepository(AppDataSource.getRepository(CardHistory));

const boardService = new BoardService(
  listRepository,
  cardRepository,
  memberRepository,
  workspaceRepository,
  logger,
);

export const boardController = new BoardController(boardService);
export const boardRouter = boardController.router;
