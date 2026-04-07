import pino from 'pino';
import { AppDataSource } from '@config';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { WorkspaceInvite } from './entities/workspace-invite.entity';
import { WorkspaceTag } from './entities/workspace-tag.entity';
import { WorkspacePriority } from './entities/workspace-priority.entity';
import { WorkspaceRepository } from './repositories/workspace.repository';
import { WorkspaceMemberRepository } from './repositories/workspace-member.repository';
import { WorkspaceInviteRepository } from './repositories/workspace-invite.repository';
import { WorkspaceTagRepository } from './repositories/workspace-tag.repository';
import { WorkspacePriorityRepository } from './repositories/workspace-priority.repository';
import { WorkspaceService } from './services/workspace.service';
import { MembersService } from './services/members.service';
import { SettingsService } from './services/settings.service';
import { WorkspaceController } from './controllers/workspace.controller';
import { MembersController } from './controllers/members.controller';
import { SettingsController } from './controllers/settings.controller';

const logger = pino({ name: 'workspaces' });

export const workspaceRepository = new WorkspaceRepository(AppDataSource.getRepository(Workspace));
export const memberRepository = new WorkspaceMemberRepository(AppDataSource.getRepository(WorkspaceMember));
export const inviteRepository = new WorkspaceInviteRepository(AppDataSource.getRepository(WorkspaceInvite));
export const tagRepository = new WorkspaceTagRepository(AppDataSource.getRepository(WorkspaceTag));
export const priorityRepository = new WorkspacePriorityRepository(AppDataSource.getRepository(WorkspacePriority));

const workspaceService = new WorkspaceService(workspaceRepository, memberRepository, inviteRepository, logger);
const membersService = new MembersService(memberRepository, inviteRepository, logger);
const settingsService = new SettingsService(tagRepository, priorityRepository, memberRepository, logger);

export const workspaceController = new WorkspaceController(workspaceService, membersService);
export const membersController = new MembersController(membersService);
export const settingsController = new SettingsController(settingsService);

export const workspaceRouter = workspaceController.router;
export const membersRouter = membersController.router;
export const settingsRouter = settingsController.router;
