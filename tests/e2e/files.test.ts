import { describe, expect, it } from 'vitest';
import './setup';
import { api, uploadMultipart } from '../helpers/http';
import { contextoOwner, registrarUsuario } from '../helpers/factories';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function pngForm(fields: Record<string, string> = {}): FormData {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    form.append(name, value);
  }
  form.append('file', new Blob([PNG_1X1], { type: 'image/png' }), 'pixel.png');
  return form;
}

describe('POST /api/files/avatar', () => {
  it('envia o avatar do usuário autenticado', async () => {
    const user = await registrarUsuario();
    const response = await uploadMultipart<{ url: string; publicId: string }>(
      '/api/files/avatar',
      user.token,
      pngForm(),
    );

    expect(response.status).toBe(201);
    expect(response.body.publicId).toContain('avatars/');
    expect(response.body.url).toContain('memory://');
  });

  it('bloqueia o upload sem token', async () => {
    const response = await api('POST', '/api/files/avatar');
    expect(response.status).toBe(401);
  });
});

describe('POST /api/files/attachments', () => {
  it('envia um anexo para o workspace', async () => {
    const ctx = await contextoOwner();
    const response = await uploadMultipart<{ url: string; publicId: string }>(
      '/api/files/attachments',
      ctx.user.token,
      pngForm({ workspace_id: ctx.workspace.id }),
    );

    expect(response.status).toBe(201);
    expect(response.body.publicId).toContain(`${ctx.workspace.id}/attachments/`);
  });

  it('exige o workspace_id no multipart', async () => {
    const ctx = await contextoOwner();
    const response = await uploadMultipart('/api/files/attachments', ctx.user.token, pngForm());
    expect(response.status).toBe(400);
  });

  it('impede upload em workspace alheio', async () => {
    const ctx = await contextoOwner();
    const stranger = await registrarUsuario();
    const response = await uploadMultipart(
      '/api/files/attachments',
      stranger.token,
      pngForm({ workspace_id: ctx.workspace.id }),
    );
    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/files/attachments', () => {
  it('remove o anexo pelo key do workspace', async () => {
    const ctx = await contextoOwner();
    const uploaded = await uploadMultipart<{ publicId: string }>(
      '/api/files/attachments',
      ctx.user.token,
      pngForm({ workspace_id: ctx.workspace.id }),
    );
    const response = await api('DELETE', '/api/files/attachments', {
      token: ctx.user.token,
      body: { workspace_id: ctx.workspace.id, key: uploaded.body.publicId },
    });
    expect(response.status).toBe(204);
  });

  it('rejeita uma key que não pertence ao workspace', async () => {
    const ctx = await contextoOwner();
    const response = await api('DELETE', '/api/files/attachments', {
      token: ctx.user.token,
      body: { workspace_id: ctx.workspace.id, key: 'outro/attachments/x.png' },
    });
    expect(response.status).toBe(400);
  });
});

describe('GET /api/files/:workspaceName/:workspaceId/:category/:fileName', () => {
  it('devolve a URL assinada do anexo', async () => {
    const ctx = await contextoOwner();
    const uploaded = await uploadMultipart<{ publicId: string }>(
      '/api/files/attachments',
      ctx.user.token,
      pngForm({ workspace_id: ctx.workspace.id }),
    );
    const fileName = uploaded.body.publicId.split('/').pop() ?? 'pixel.png';
    const response = await api<string>(
      'GET',
      `/api/files/${encodeURIComponent(ctx.workspace.name)}/${ctx.workspace.id}/attachments/${fileName}`,
      { token: ctx.user.token },
    );

    expect(response.status).toBe(200);
    expect(String(response.body)).toContain('memory://signed/');
  });
});
