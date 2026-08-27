import { User } from './user.entity';
import { Workspace } from './workspace.entity';
import { WorkspaceMember } from './workspace-member.entity';
import { WorkspaceInvite } from './workspace-invite.entity';
import { WorkspaceTag } from './workspace-tag.entity';
import { WorkspacePriority } from './workspace-priority.entity';
import { List } from './list.entity';
import { Card } from './card.entity';
import { CardHistory } from './card-history.entity';
import { Comment } from './comment.entity';
import { Notification } from './notification.entity';
import { Diagram } from './diagram.entity';

export const entities = [
  User,
  Workspace,
  WorkspaceMember,
  WorkspaceInvite,
  WorkspaceTag,
  WorkspacePriority,
  List,
  Card,
  CardHistory,
  Comment,
  Notification,
  Diagram,
];

export {
  User,
  Workspace,
  WorkspaceMember,
  WorkspaceInvite,
  WorkspaceTag,
  WorkspacePriority,
  List,
  Card,
  CardHistory,
  Comment,
  Notification,
  Diagram,
};

export type { CardWithCount } from './card.entity';
