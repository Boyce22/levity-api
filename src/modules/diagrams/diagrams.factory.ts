import { AppDataSource } from '@config';
import { Diagram } from './entities/diagram.entity';
import { DiagramRepository } from './repositories/diagram.repository';
import { DiagramsService } from './diagrams.service';
import { DiagramsController } from './diagrams.controller';
import { cardRepository, listRepository } from '@/modules/boards/board.factory';
import { memberRepository } from '@/modules/workspaces/workspace.factory';

const diagramRepository = new DiagramRepository(AppDataSource.getRepository(Diagram));
const diagramsService = new DiagramsService(diagramRepository, cardRepository, listRepository, memberRepository);
export const diagramsController = new DiagramsController(diagramsService);
export const diagramsRouter = diagramsController.router;
