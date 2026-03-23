import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ApiKeysRepository } from './api-keys.repository';

@Injectable()
export class ApiKeysService {
  constructor(private readonly repository: ApiKeysRepository) {}

  async list(workspaceId: string) {
    const keys = await this.repository.findByWorkspace(workspaceId);
    return keys.map(({ key_hash: _key_hash, ...rest }) => rest);
  }

  async create(userId: string, data: { workspaceId: string; name: string; scopes: string[] }) {
    const rawKey = `mm_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = rawKey.substring(0, 10);
    const keyHash = await bcrypt.hash(rawKey, 12);

    const apiKey = await this.repository.create({
      workspace_id: data.workspaceId,
      name: data.name,
      scopes: data.scopes,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      is_active: true,
    });

    return { id: apiKey.id, name: apiKey.name, key: rawKey, keyPrefix, scopes: data.scopes, message: 'Store this key securely. It will not be shown again.' };
  }

  async getById(id: string) {
    const key = await this.repository.findById(id);
    if (!key) throw new NotFoundException('API key not found');
    const { key_hash: _key_hash, ...rest } = key;
    return rest;
  }

  async update(id: string, data: { name?: string; scopes?: string[] }) { return this.repository.update(id, data); }

  async revoke(id: string) {
    await this.repository.update(id, { is_active: false });
    return { message: 'API key revoked' };
  }

  async rotate(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('API key not found');

    const rawKey = `mm_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = rawKey.substring(0, 10);
    const keyHash = await bcrypt.hash(rawKey, 12);

    await this.repository.update(id, { key_hash: keyHash, key_prefix: keyPrefix });
    return { id, key: rawKey, keyPrefix, message: 'Store this key securely. It will not be shown again.' };
  }

  async validateKey(rawKey: string): Promise<Record<string, unknown> | null> {
    const prefix = rawKey.substring(0, 10);
    const candidates = await this.repository.findByPrefix(prefix);
    for (const candidate of candidates) {
      if (candidate.is_active && await bcrypt.compare(rawKey, candidate.key_hash)) {
        await this.repository.updateLastUsed(candidate.id);
        return candidate;
      }
    }
    return null;
  }
}
