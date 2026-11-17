import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { InboxChange } from './models';

/** What the inbox needs from its live connection. */
export interface InboxHubHandlers {
  /** The hub's one event, `inboxChanged`. */
  changed(change: InboxChange): void;
  /** Connected again after a drop: anything may have changed meanwhile, so reload. */
  reconnected(): void;
}

/** A live connection; `stop()` ends it. */
export interface InboxHubHandle {
  stop(): Promise<void>;
}

/**
 * Opens the inbox hub (`/hubs/inbox?tenant=…`, the token as `access_token` in the query, as WebSockets need). It reconnects on its own, and
 * after the server closes a session whose token expired it starts again with a fresh token. Replace it in tests.
 */
@Injectable({ providedIn: 'root' })
export class InboxHubConnector {
  connect(url: string, tenantId: string, accessToken: () => string | null, handlers: InboxHubHandlers): InboxHubHandle {
    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(`${url}?tenant=${encodeURIComponent(tenantId)}`, { accessTokenFactory: () => accessToken() ?? '' })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();
    connection.on('inboxChanged', (change: InboxChange) => handlers.changed(change));
    connection.onreconnected(() => handlers.reconnected());
    let stopped = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const start = (delay: number) => {
      connection.start().then(() => delay > 1000 && handlers.reconnected()).catch(() => {
        // Refused (an expired token, the server not up yet): try again, more slowly each time, up to a minute.
        if (!stopped) {
          retry = setTimeout(() => start(Math.min(delay * 2, 60_000)), delay);
        }
      });
    };
    // Closed for good (automatic reconnection gave up, or the server ended a session whose token expired): start again.
    connection.onclose(() => {
      if (!stopped && connection.state === HubConnectionState.Disconnected) {
        retry = setTimeout(() => start(2000), 1000);
      }
    });
    start(1000);
    return {
      stop: () => {
        stopped = true;
        clearTimeout(retry);
        return connection.stop();
      },
    };
  }
}
