import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { InboxHubConnector, InboxHubHandlers } from './inbox-hub';
import { InboxCounts, InboxItem } from './models';
import { NOTIFICATIONS_CONFIG } from './notifications.config';

export const TENANT = '0193f0aa-0000-7000-8000-0000000000a1';
export const API = 'https://notifications.test';
export const ME = `${API}/api/v1/tenants/${TENANT}/me`;

/** A JWT (unsigned) whose payload has these claims. */
export function jwt(claims: Record<string, unknown>): string {
  const encode = (o: unknown) => btoa(Array.from(new TextEncoder().encode(JSON.stringify(o)), (b) => String.fromCharCode(b)).join('')).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'none' })}.${encode(claims)}.`;
}

/** The hub, by hand: what it was connected with, and a way to say something. */
export class FakeHub extends InboxHubConnector {
  connections: { url: string; tenant: string; token: () => string | null; handlers: InboxHubHandlers; stopped: boolean }[] = [];

  override connect(url: string, tenant: string, token: () => string | null, handlers: InboxHubHandlers) {
    const connection = { url, tenant, token, handlers, stopped: false };
    this.connections.push(connection);
    return { stop: async () => { connection.stopped = true; } };
  }

  get last() {
    return this.connections[this.connections.length - 1];
  }
}

export function providers(hub: FakeHub, token = jwt({ platform_tenant: TENANT, sub: 'ann' }), pageSize = 2): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(),
    provideTranslateService(),
    provideHttpClientTesting(),
    { provide: NOTIFICATIONS_CONFIG, useValue: { apiUrl: API, accessToken: () => token, pageSize } },
    { provide: InboxHubConnector, useValue: hub },
  ];
}

export function item(id: string, change: Partial<InboxItem> = {}): InboxItem {
  return {
    id, type: 'sample.paged', group: 'general', title: 'Title ' + id, body: 'Body ' + id, url: null, actions: null, actionable: false,
    priority: 'normal', createdAt: '2026-11-17T08:00:00Z', readAt: null, archivedAt: null, ...change,
  };
}

export function counts(unread: number, groups: [string, number][] = [['approval', 0], ['general', unread]]): InboxCounts {
  return {
    groups: groups.map(([key, u], i) => ({ key, name: key[0].toUpperCase() + key.slice(1), position: i * 10, open: u, unread: u })),
    unread, actionableOpen: 0,
  };
}
