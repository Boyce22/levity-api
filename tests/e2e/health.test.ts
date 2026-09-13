import { describe, expect, it } from 'vitest';
import './setup';
import { api } from '../helpers/http';

describe('GET /', () => {
  it('identifica a API e aponta os endpoints principais', async () => {
    const response = await api<{ name: string; version: string; endpoints: { health: string; api: string } }>('GET', '/');

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Levity API');
    expect(response.body.endpoints).toEqual({ health: '/health', api: '/api' });
  });
});

describe('GET /health', () => {
  it('confirma que o serviço está no ar no ambiente de teste', async () => {
    const response = await api<{ status: string; environment: string; timestamp: string }>('GET', '/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.environment).toBe('test');
    expect(response.body.timestamp).toBeTruthy();
  });
});
