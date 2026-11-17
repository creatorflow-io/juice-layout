/**
 * The shapes of the Juice.Notifications person's API (`/api/v1/tenants/{tenantId}/me/…`), as it sends them: camelCase, enums as strings,
 * times as ISO 8601 text.
 */

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

/** An action a type declares (`{ id, label }`): listed on its items, acted on from phase 3. */
export interface InboxAction {
  id: string;
  label: string;
}

/** A correlation's state, as the API writes it (camelCase). */
export type CorrelationState = 'open' | 'acknowledged' | 'resolved' | 'cancelled';

/** The item's correlation: open ones wait for someone; a resolved one shows its outcome (Juice.Notifications phase 3). */
export interface InboxCorrelation {
  state: CorrelationState;
  outcome: string | null;
  acknowledgedBy: string | null;
  resolvedAt: string | null;
}

/** What the person did with the item: `read`, `acknowledged`, or `action` with its id. */
export interface InboxInteraction {
  kind: 'read' | 'acknowledged' | 'action';
  actionId: string | null;
  at: string;
}

/** An item in the person's inbox. */
export interface InboxItem {
  id: string;
  type: string;
  group: string;
  title: string;
  body: string;
  url: string | null;
  actions: InboxAction[] | null;
  actionable: boolean;
  priority: NotificationPriority;
  createdAt: string;
  readAt: string | null;
  archivedAt: string | null;
  /** Null when the notification has no correlation key. */
  correlation?: InboxCorrelation | null;
  interactions?: InboxInteraction[];
}

/** Whether the item's actions can still be chosen: it has some, and its correlation (if any) is open or acknowledged. */
export function canAct(item: InboxItem): boolean {
  return !!item.actions?.length && (!item.correlation || item.correlation.state === 'open' || item.correlation.state === 'acknowledged');
}

/** The action the person chose on the item, if any. */
export function chosenAction(item: InboxItem): string | null {
  return item.interactions?.find((i) => i.kind === 'action')?.actionId ?? null;
}

/** A display group of the tenant, in order, with the person's open and unread counts in it. */
export interface InboxGroupCount {
  key: string;
  name: string;
  position: number;
  open: number;
  unread: number;
}

export interface InboxCounts {
  groups: InboxGroupCount[];
  unread: number;
  actionableOpen: number;
}

/** What a listing asks for; everything is optional. */
export interface InboxQuery {
  /** A display group's key; left out: every group. */
  group?: string;
  unread?: boolean;
  /** Actionable and open (not archived). */
  actionable?: boolean;
  /** Archived items instead of open ones. */
  archived?: boolean;
  /** The id of the last item already shown: the page after it. */
  before?: string;
  /** At most 100; the API's default is 50. */
  limit?: number;
}

/** What the inbox hub says: `added` or `changed` with the items, or `reset` (reload everything). */
export interface InboxChange {
  kind: 'added' | 'changed' | 'reset';
  items: string[];
}

export type PreferenceMode = 'on' | 'off' | 'digest';

/** How the person hears about a category (or `*`) on a channel (or `*`); the most specific choice wins. */
export interface Preference {
  category: string;
  channel: string;
  mode: PreferenceMode;
  updatedAt?: string;
}

/** A quiet period: on `days` (`mon` … `sun`; null: every day) from `start` to `end` (`HH:mm`), in `timeZone` (IANA). */
export interface QuietHours {
  days: string[] | null;
  start: string;
  end: string;
  timeZone: string | null;
}

/** The signed-in person as the service knows them. */
export interface Me {
  id: string;
  source: string;
  externalId: string;
  name: string | null;
  locale: string | null;
  timeZone: string | null;
  quietHours: QuietHours | null;
}

/** As the API writes it (camelCase: `ok`, `bouncing`, `failed`). A failed address isn't used until verified again. */
export type ContactHealth = 'ok' | 'bouncing' | 'failed';

/** One of the person's addresses; only a verified one that hasn't failed is used. */
export interface ContactPoint {
  id: string;
  channel: string;
  address: string;
  verified: boolean;
  verifiedAt: string | null;
  verifiedBy: string | null;
  health: ContactHealth;
  healthReason: string | null;
  createdAt: string;
}

/** A verification code is on its way, valid until `expiresAt`. */
export interface VerificationSent {
  expiresAt: string;
}

/** The API's error body (RFC 9457 problem details with a `code`, and field errors by JSON pointer). */
export interface NotificationsProblem {
  status: number;
  code: string;
  detail?: string;
  errors?: { pointer: string; message: string }[];
}
