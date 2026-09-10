import { User } from './user.entity';
import { Workspace } from './workspace.entity';
import { WorkspaceMember } from './workspace-member.entity';
import { WorkspaceInvite } from './workspace-invite.entity';
import { InviteBoardGrant } from './invite-board-grant.entity';
import { WorkspaceTag } from './workspace-tag.entity';
import { WorkspacePriority } from './workspace-priority.entity';
import { Board } from './board.entity';
import { BoardMember } from './board-member.entity';
import { BoardColumn } from './board-column.entity';
import { Issue } from './issue.entity';
import { IssueEvent } from './issue-event.entity';
import { IssueComment } from './issue-comment.entity';
import { Notification } from './notification.entity';
import { IssueDiagram } from './issue-diagram.entity';
import { Sprint } from './sprint.entity';
import { SprintIssue } from './sprint-issue.entity';

export const entities = [
  User,
  Workspace,
  WorkspaceMember,
  WorkspaceInvite,
  InviteBoardGrant,
  WorkspaceTag,
  WorkspacePriority,
  Board,
  BoardMember,
  BoardColumn,
  Issue,
  IssueEvent,
  IssueComment,
  Notification,
  IssueDiagram,
  Sprint,
  SprintIssue,
];

export {
  User,
  Workspace,
  WorkspaceMember,
  WorkspaceInvite,
  InviteBoardGrant,
  WorkspaceTag,
  WorkspacePriority,
  Board,
  BoardMember,
  BoardColumn,
  Issue,
  IssueEvent,
  IssueComment,
  Notification,
  IssueDiagram,
  Sprint,
  SprintIssue,
};

export type { IssueWithCount } from './issue.entity';
