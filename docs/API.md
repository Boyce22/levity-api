# Levity Backend — API Documentation

**Framework**: Express.js 5 + TypeScript  
**Base URL**: `http://localhost:3001/api` (check `.env` for `PORT`)  
**Authentication**: JWT Bearer Token — `Authorization: Bearer <token>`

> All timestamps are ISO 8601 strings (e.g. `"2024-04-06T15:30:00.000Z"`).  
> All IDs are UUIDs.

---

## Table of Contents

1. [Auth](#1-auth)
2. [Users](#2-users)
3. [Workspaces](#3-workspaces)
4. [Members](#4-members)
5. [Settings — Tags & Priorities](#5-settings--tags--priorities)
6. [Board — Lists & Cards](#6-board--lists--cards)
7. [Comments](#7-comments)
8. [Notifications](#8-notifications)
9. [Diagrams](#9-diagrams)
10. [Files & Attachments](#10-files--attachments)
11. [Error Handling](#error-handling)
12. [Roles & Permissions](#roles--permissions)
13. [Route Summary](#route-summary)

---

## 1. Auth

**Base path**: `/api/auth`  
No authentication required.

---

### `POST /api/auth/register`

Register a new user.

**Request body**:
```json
{
  "userName": "string (3–30 chars)",
  "password": "string (min 5 chars)",
  "email": "string (optional, valid email)"
}
```

**Response** `201 Created`:
```json
{
  "accessToken": "jwt-string",
  "user": {
    "id": "uuid",
    "userName": "string"
  }
}
```

---

### `POST /api/auth/login`

Authenticate and receive a JWT token.

**Request body**:
```json
{
  "userName": "string (min 3 chars)",
  "password": "string (min 5 chars)"
}
```

**Response** `200 OK`:
```json
{
  "accessToken": "jwt-string",
  "user": {
    "id": "uuid",
    "userName": "string"
  }
}
```

---

## 2. Users

**Base path**: `/api/users`  
All routes require authentication.

---

### `GET /api/users/me`

Get the authenticated user's full profile.

**Response** `200 OK`:
```json
{
  "id": "uuid",
  "username": "string",
  "display_name": "string | null",
  "avatar_url": "string | null",
  "bio": "string | null",
  "email": "string | null",
  "created_at": "ISOString"
}
```

---

### `PATCH /api/users/me`

Update the authenticated user's profile. All fields are optional.

**Request body**:
```json
{
  "display_name": "string (1–50 chars)",
  "avatar_url": "string (URL)",
  "bio": "string (max 500 chars)",
  "email": "string (valid email)"
}
```

**Response** `200 OK`: Updated user object (same shape as `GET /users/me`).

---

### `GET /api/users/`

List users filtered by workspace. Returns public profile only.

**Query params**:
| Param | Type | Required | Description |
|---|---|---|---|
| `workspace_id` | UUID | No | Filter members of a workspace |
| `search` | string | No | Search by username / display name |

**Response** `200 OK`:
```json
[
  {
    "id": "uuid",
    "username": "string",
    "display_name": "string | null",
    "avatar_url": "string | null"
  }
]
```

Returns `[]` if `workspace_id` is not provided.

---

## 3. Workspaces

**Base path**: `/api/workspaces`  
All routes require authentication.

---

### `GET /api/workspaces/`

List all workspaces the authenticated user belongs to.

**Response** `200 OK`:
```json
[
  {
    "id": "uuid",
    "name": "string",
    "created_by": "uuid",
    "created_at": "ISOString",
    "updated_at": "ISOString"
  }
]
```

---

### `POST /api/workspaces/`

Create a new workspace. The creator is automatically added as `owner`.

**Request body**:
```json
{
  "name": "string (1–100 chars)"
}
```

**Response** `201 Created`: Workspace object (same shape as list item above).

---

### `PATCH /api/workspaces/:id`

Rename a workspace. Requires `owner` or `admin` role.

**Request body**:
```json
{
  "name": "string (1–100 chars)"
}
```

**Response** `200 OK`: Updated workspace object.

---

### `DELETE /api/workspaces/:id`

Delete a workspace permanently. Requires `owner` role.

**Response** `204 No Content`

---

### `GET /api/workspaces/:id/invites`

List all invites for a workspace. Requires `owner` or `admin` role.

**Response** `200 OK`:
```json
[
  {
    "id": "uuid",
    "workspace_id": "uuid",
    "token": "string",
    "created_by": "uuid",
    "max_uses": 1,
    "current_uses": 0,
    "expires_at": "ISOString | null",
    "role": "owner | admin | member | editor | viewer",
    "created_at": "ISOString"
  }
]
```

---

### `POST /api/workspaces/:id/invites`

Generate an invite link. Requires `owner` or `admin` role.

**Request body** (all fields optional):
```json
{
  "max_uses": "number (1–100, default: 1)",
  "expires_in_hours": "number (max 720)",
  "role": "owner | admin | member | editor | viewer (default: member)"
}
```

**Response** `201 Created`:
```json
{
  "id": "uuid",
  "workspace_id": "uuid",
  "token": "string",
  "created_by": "uuid",
  "max_uses": 1,
  "current_uses": 0,
  "expires_at": "ISOString | null",
  "revoked_at": "ISOString | null",
  "role": "member",
  "created_at": "ISOString"
}
```

---

### `GET /api/workspaces/:id/invites/:token`

Get details about an invite by its token. Useful to show a preview before the user accepts.

**Response** `200 OK`: Invite object (same shape as `POST /invites` response).

---

### `POST /api/workspaces/:id/invites/:token/accept`

Accept an invite and join the workspace.

**Response** `200 OK`:
```json
{
  "id": "uuid",
  "workspace_id": "uuid",
  "user_id": "uuid",
  "role": "member",
  "joined_at": "ISOString"
}
```

---

### `DELETE /api/workspaces/:id/invites/:inviteId`

Revoke an invite. Requires `owner` or `admin` role.

**Response** `204 No Content`

---

## 4. Members

**Base path**: `/api/workspaces/:id`  
All routes require authentication.

---

### `GET /api/workspaces/:id/members`

List all members of a workspace.

**Response** `200 OK`:
```json
[
  {
    "id": "uuid",
    "workspace_id": "uuid",
    "user_id": "uuid",
    "role": "owner | admin | member | editor | viewer",
    "joined_at": "ISOString"
  }
]
```

> To display user names/avatars alongside members, cross-reference with `GET /users/?workspace_id=:id`.

---

### `PATCH /api/workspaces/:id/members/:memberId/role`

Update a member's role. Requires `owner` or `admin` role.

**Request body**:
```json
{
  "role": "owner | admin | member | editor | viewer"
}
```

**Response** `200 OK`: Updated member object (same shape as list item above).

---

### `DELETE /api/workspaces/:id/members/:memberId`

Remove a member from the workspace. Requires `owner` or `admin` role.

**Response** `204 No Content`

---

## 5. Settings — Tags & Priorities

**Base path**: `/api/workspaces/:id`  
All routes require authentication and membership in the workspace.

---

### `GET /api/workspaces/:id/tags`

List all tags of a workspace.

**Response** `200 OK`:
```json
[
  {
    "id": "uuid",
    "workspace_id": "uuid",
    "name": "string",
    "color": "#hex",
    "created_at": "ISOString"
  }
]
```

---

### `POST /api/workspaces/:id/tags`

Create a tag.

**Request body**:
```json
{
  "name": "string (1–50 chars)",
  "color": "#rrggbb (hex color)"
}
```

**Response** `201 Created`: Tag object (same shape as list item above).

---

### `DELETE /api/workspaces/:id/tags/:tagId`

Delete a tag.

**Response** `204 No Content`

---

### `GET /api/workspaces/:id/priorities`

List all priorities of a workspace.

**Response** `200 OK`:
```json
[
  {
    "id": "uuid",
    "workspace_id": "uuid",
    "name": "string",
    "color": "#hex",
    "icon": "string",
    "position": 0,
    "created_at": "ISOString"
  }
]
```

---

### `POST /api/workspaces/:id/priorities`

Create a priority.

**Request body**:
```json
{
  "name": "string (1–50 chars)",
  "color": "#rrggbb (hex color)",
  "icon": "string (1–10 chars)",
  "position": "number (optional, default 0)"
}
```

**Response** `201 Created`: Priority object (same shape as list item above).

---

### `DELETE /api/workspaces/:id/priorities/:priorityId`

Delete a priority.

**Response** `204 No Content`

---

## 6. Board — Lists & Cards

**Base path**: `/api/workspaces/:workspaceId`  
All routes require authentication and membership in the workspace.

---

### `GET /api/workspaces/:workspaceId/board`

Get the full board snapshot: workspace metadata, all lists with cards, members, tags, and priorities.

**Response** `200 OK`:
```json
{
  "workspace": {
    "id": "uuid",
    "name": "string",
    "created_by": "uuid",
    "created_at": "ISOString",
    "updated_at": "ISOString"
  },
  "lists": [
    {
      "id": "uuid",
      "title": "string",
      "position": 0,
      "wip_limit": "number | null",
      "list_type": "todo | in_progress | review | done | null",
      "workspace_id": "uuid",
      "created_at": "ISOString",
      "cards": [
        {
          "id": "uuid",
          "content": "string",
          "position": 0,
          "description": "string | null",
          "cover_url": "string | null",
          "assignee_id": "uuid | null",
          "priority": "string | null",
          "label": "string | null",
          "progress": "number | null",
          "due_date": "ISOString | null",
          "list_id": "uuid",
          "created_by": "uuid",
          "created_at": "ISOString"
        }
      ]
    }
  ],
  "members": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "user_id": "uuid",
      "role": "owner | admin | member | editor | viewer",
      "joined_at": "ISOString"
    }
  ],
  "tags": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "name": "string",
      "color": "#hex",
      "created_at": "ISOString"
    }
  ],
  "priorities": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "name": "string",
      "color": "#hex",
      "icon": "string",
      "position": 0,
      "created_at": "ISOString"
    }
  ]
}
```

---

### `POST /api/workspaces/:workspaceId/lists`

Create a new list.

**Request body**:
```json
{
  "title": "string (1–100 chars)",
  "position": "number (optional, default 0)"
}
```

**Response** `201 Created`:
```json
{
  "id": "uuid",
  "title": "string",
  "position": 0,
  "wip_limit": null,
  "list_type": null,
  "workspace_id": "uuid",
  "created_at": "ISOString",
  "cards": []
}
```

---

### `PATCH /api/workspaces/:workspaceId/lists/positions`

Bulk-update list positions (drag-and-drop reorder).

**Request body**:
```json
[
  { "id": "uuid", "position": 0 },
  { "id": "uuid", "position": 1 }
]
```

**Response** `204 No Content`

---

### `PATCH /api/workspaces/:workspaceId/lists/:listId`

Update a list's properties. All fields optional.

**Request body**:
```json
{
  "title": "string (1–100 chars)",
  "position": "number",
  "wip_limit": "number (positive) | null",
  "list_type": "todo | in_progress | review | done | null"
}
```

**Response** `200 OK`: Updated list object (same shape as `POST /lists` response, cards included).

---

### `DELETE /api/workspaces/:workspaceId/lists/:listId`

Delete a list and cascade-delete all its cards.

**Response** `204 No Content`

---

### `POST /api/workspaces/:workspaceId/cards`

Create a new card.

**Request body**:
```json
{
  "content": "string (1–500 chars)",
  "list_id": "uuid",
  "position": "number (optional, default 0)"
}
```

**Response** `201 Created`:
```json
{
  "id": "uuid",
  "content": "string",
  "position": 0,
  "description": null,
  "cover_url": null,
  "assignee_id": null,
  "priority": null,
  "label": null,
  "progress": null,
  "due_date": null,
  "list_id": "uuid",
  "created_by": "uuid",
  "created_at": "ISOString"
}
```

---

### `PATCH /api/workspaces/:workspaceId/cards/positions`

Bulk-update card positions. Supports moving cards between lists.

**Request body**:
```json
[
  { "id": "uuid", "position": 0, "list_id": "uuid (optional)" }
]
```

**Response** `204 No Content`

---

### `PATCH /api/workspaces/:workspaceId/cards/:cardId`

Update a card. All fields optional (send only what changed).

**Request body**:
```json
{
  "content": "string (1–500 chars)",
  "description": "string (max 10000 chars) | null",
  "cover_url": "string (URL) | null",
  "assignee_id": "uuid | null",
  "priority": "string | null",
  "label": "string | null",
  "progress": "number (0–100) | null",
  "due_date": "ISOString | null",
  "list_id": "uuid",
  "position": "number"
}
```

**Response** `200 OK`: Updated card object (same shape as `POST /cards` response).

---

### `DELETE /api/workspaces/:workspaceId/cards/:cardId`

Delete a card.

**Response** `204 No Content`

---

## 7. Comments

**Base path**: `/api/comments`  
All routes require authentication and membership in the card's workspace.

---

### `GET /api/comments/`

List comments for a card, cursor-paginated (newest-first).

**Query params**:
| Param | Type | Required | Description |
|---|---|---|---|
| `card_id` | UUID | Yes | Card to fetch comments for |
| `limit` | number (1–50) | No | Default: `20` |
| `cursor` | string | No | ISO timestamp cursor from previous page |

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "uuid",
      "card_id": "uuid",
      "created_by": "uuid",
      "parent_id": "uuid | null",
      "content": "string",
      "created_at": "ISOString"
    }
  ],
  "nextCursor": "ISOString | null"
}
```

> `nextCursor` is `null` when there are no more pages.

---

### `POST /api/comments/`

Create a comment on a card. Use `parent_id` for replies.  
Mentions (`@username`) automatically trigger notifications.

**Request body**:
```json
{
  "card_id": "uuid",
  "content": "string (1–5000 chars)",
  "parent_id": "uuid (optional — reply to a comment)"
}
```

**Response** `201 Created`: Comment object (same shape as item in `GET /comments` data array).

---

### `PATCH /api/comments/:id`

Edit a comment. Only the comment author can edit.

**Request body**:
```json
{
  "content": "string (1–5000 chars)"
}
```

**Response** `200 OK`: Updated comment object.

---

### `DELETE /api/comments/:id`

Delete a comment. Only the comment author can delete.

**Response** `204 No Content`

---

## 8. Notifications

**Base path**: `/api/notifications`  
All routes require authentication.

---

### `GET /api/notifications/`

List notifications for the authenticated user, offset-paginated.

**Query params**:
| Param | Type | Required | Description |
|---|---|---|---|
| `read` | boolean | No | Filter by read (`true`) or unread (`false`) status |
| `page` | number | No | Default: `1` |
| `limit` | number (1–50) | No | Default: `20` |

**Response** `200 OK`:
```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "actor_id": "uuid",
      "card_id": "uuid",
      "type": "mention | assignment | reply | comment",
      "content": "string",
      "read": false,
      "created_at": "ISOString"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

### `PATCH /api/notifications/:id/read`

Mark a single notification as read.

**Response** `204 No Content`

---

### `POST /api/notifications/read-all`

Mark all notifications for the authenticated user as read.

**Response** `204 No Content`

---

## 9. Diagrams

**Base path**: `/api/diagrams`  
All routes require authentication and membership in the card's workspace.

---

### `GET /api/diagrams/:cardId`

Get the diagram associated with a card. Returns `null` if none exists.

**Response** `200 OK`:
```json
{
  "id": "uuid",
  "card_id": "uuid",
  "data": {
    "elements": [
      {
        "id": "string",
        "type": "path | rect | circle | db | cloud | server | user | arrow | line | eraser",
        "x": 0,
        "y": 0,
        "width": 100,
        "height": 100,
        "color": "string",
        "size": 2,
        "points": [{ "x": 0, "y": 0 }]
      }
    ]
  },
  "created_at": "ISOString",
  "updated_at": "ISOString"
}
```

Returns `null` if no diagram exists for the card.

---

### `PUT /api/diagrams/`

Create or update (upsert) the diagram for a card.

**Request body**:
```json
{
  "card_id": "uuid",
  "data": {
    "elements": [
      {
        "id": "string",
        "type": "path | rect | circle | db | cloud | server | user | arrow | line | eraser",
        "x": 0,
        "y": 0,
        "width": 100,
        "height": 100,
        "color": "#hex",
        "size": 2,
        "points": [{ "x": 0, "y": 0 }]
      }
    ]
  }
}
```

> `elements` max: 1000 items. `points` per element max: 2500.

**Response** `200 OK`: Saved diagram object (same shape as `GET /diagrams/:cardId`).

---

### `DELETE /api/diagrams/:cardId`

Delete the diagram for a card.

**Response** `204 No Content`

---

## 10. Files & Attachments

**Base path**: `/api/files`  
All routes require authentication.  
Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`  
Max file size: **10 MB**

---

### `POST /api/files/attachments`

Upload a file attachment linked to a workspace.

**Request**: `multipart/form-data`
| Field | Type | Required |
|---|---|---|
| `file` | file | Yes |
| `workspace_id` | string (UUID) | Yes |

**Response** `201 Created`:
```json
{
  "url": "string (public URL)",
  "publicId": "string (storage key — save this to delete the file later)"
}
```

---

### `POST /api/files/avatar`

Upload a user avatar. Automatically resized to 256×256 WebP.

**Request**: `multipart/form-data`
| Field | Type | Required |
|---|---|---|
| `file` | file | Yes |

**Response** `201 Created`: Same shape as attachments (`{url, publicId}`).

---

### `DELETE /api/files/attachments`

Delete a previously uploaded file.

**Request body** (JSON):
```json
{
  "workspace_id": "uuid",
  "key": "string (the publicId returned on upload)"
}
```

**Response** `204 No Content`

---

## Error Handling

All error responses share the same structure:

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

Validation errors (Zod) return `422` with field details:
```json
{
  "error": "Validation error",
  "details": [
    { "field": "userName", "message": "String must contain at least 3 character(s)" }
  ]
}
```

### HTTP Status Codes

| Status | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `204` | No Content |
| `400` | Bad Request (missing required param) |
| `401` | Unauthorized — missing, invalid, or expired token |
| `403` | Forbidden — insufficient role |
| `404` | Not Found |
| `409` | Conflict (e.g. username taken, already a member) |
| `422` | Unprocessable Entity — validation error |
| `429` | Too Many Requests — rate limit (production only) |
| `500` | Internal Server Error |

---

## Roles & Permissions

Roles in ascending order of privilege: `viewer` < `editor` < `member` < `admin` < `owner`.

| Action | viewer | editor | member | admin | owner |
|---|---|---|---|---|---|
| Read board / cards | Yes | Yes | Yes | Yes | Yes |
| Create / edit cards | No | Yes | Yes | Yes | Yes |
| Manage lists | No | No | Yes | Yes | Yes |
| Manage members & invites | No | No | No | Yes | Yes |
| Delete workspace | No | No | No | No | Yes |

---

## Implementation Notes

### Bulk position updates (drag-and-drop)
`PATCH .../lists/positions` e `PATCH .../cards/positions` executam um único `UPDATE ... FROM unnest(...)` no banco — envie o array completo com todas as posições reordenadas em uma única requisição, não uma por card/list.

### Cursor pagination (Comments)
O campo de cursor retornado é `nextCursor` (camelCase). Passe como `?cursor=<valor>` na próxima requisição. Quando `nextCursor` for `null`, não há mais páginas.

### Members vs. Users
`GET /workspaces/:id/members` retorna apenas IDs (`user_id`, `role`, `joined_at`). Para exibir nomes e avatars, combine com `GET /users/?workspace_id=:id` no cliente.

### Diagram upsert
`PUT /diagrams/` é um upsert atômico — cria ou atualiza o diagrama do card em uma única operação. Não é necessário verificar existência antes de salvar.

### Files — chave de deleção
O campo `publicId` retornado no upload é a chave necessária para `DELETE /files/attachments`. Persista esse valor junto com a URL.

---

## Route Summary

| # | Method | Path | Auth | Min Role |
|---|---|---|---|---|
| 1 | POST | `/api/auth/register` | No | — |
| 2 | POST | `/api/auth/login` | No | — |
| 3 | GET | `/api/users/me` | Yes | — |
| 4 | PATCH | `/api/users/me` | Yes | — |
| 5 | GET | `/api/users/` | Yes | — |
| 6 | GET | `/api/workspaces/` | Yes | — |
| 7 | POST | `/api/workspaces/` | Yes | — |
| 8 | PATCH | `/api/workspaces/:id` | Yes | admin |
| 9 | DELETE | `/api/workspaces/:id` | Yes | owner |
| 10 | GET | `/api/workspaces/:id/invites` | Yes | admin |
| 11 | POST | `/api/workspaces/:id/invites` | Yes | admin |
| 12 | GET | `/api/workspaces/:id/invites/:token` | Yes | — |
| 13 | POST | `/api/workspaces/:id/invites/:token/accept` | Yes | — |
| 14 | DELETE | `/api/workspaces/:id/invites/:inviteId` | Yes | admin |
| 15 | GET | `/api/workspaces/:id/members` | Yes | member |
| 16 | PATCH | `/api/workspaces/:id/members/:memberId/role` | Yes | admin |
| 17 | DELETE | `/api/workspaces/:id/members/:memberId` | Yes | admin |
| 18 | GET | `/api/workspaces/:id/tags` | Yes | member |
| 19 | POST | `/api/workspaces/:id/tags` | Yes | member |
| 20 | DELETE | `/api/workspaces/:id/tags/:tagId` | Yes | member |
| 21 | GET | `/api/workspaces/:id/priorities` | Yes | member |
| 22 | POST | `/api/workspaces/:id/priorities` | Yes | member |
| 23 | DELETE | `/api/workspaces/:id/priorities/:priorityId` | Yes | member |
| 24 | GET | `/api/workspaces/:workspaceId/board` | Yes | member |
| 25 | POST | `/api/workspaces/:workspaceId/lists` | Yes | member |
| 26 | PATCH | `/api/workspaces/:workspaceId/lists/positions` | Yes | member |
| 27 | PATCH | `/api/workspaces/:workspaceId/lists/:listId` | Yes | member |
| 28 | DELETE | `/api/workspaces/:workspaceId/lists/:listId` | Yes | member |
| 29 | POST | `/api/workspaces/:workspaceId/cards` | Yes | member |
| 30 | PATCH | `/api/workspaces/:workspaceId/cards/positions` | Yes | member |
| 31 | PATCH | `/api/workspaces/:workspaceId/cards/:cardId` | Yes | member |
| 32 | DELETE | `/api/workspaces/:workspaceId/cards/:cardId` | Yes | member |
| 33 | GET | `/api/comments/` | Yes | member |
| 34 | POST | `/api/comments/` | Yes | member |
| 35 | PATCH | `/api/comments/:id` | Yes | author |
| 36 | DELETE | `/api/comments/:id` | Yes | author |
| 37 | GET | `/api/notifications/` | Yes | — |
| 38 | PATCH | `/api/notifications/:id/read` | Yes | — |
| 39 | POST | `/api/notifications/read-all` | Yes | — |
| 40 | GET | `/api/diagrams/:cardId` | Yes | member |
| 41 | PUT | `/api/diagrams/` | Yes | member |
| 42 | DELETE | `/api/diagrams/:cardId` | Yes | member |
| 43 | POST | `/api/files/attachments` | Yes | member |
| 44 | POST | `/api/files/avatar` | Yes | — |
| 45 | DELETE | `/api/files/attachments` | Yes | member |
