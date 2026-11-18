import { firstValueFrom } from 'rxjs';
import { Device } from './models';
import { NotificationsApi } from './notifications-api.service';

/** How the app turns on Web Push for the signed-in person. */
export interface WebPushOptions {
  /** The tenant's VAPID public key (its `webpush` integration's `settings.publicKey`), base64url. */
  vapidPublicKey: string;
  /** The service worker to register: the library's `juice-push-sw.js`, copied to the app's root (see the README). */
  serviceWorkerUrl?: string;
  /** What the registration is called on the service: this web app. Left out: `web`. */
  appId?: string;
  /** The person's locale for this device. */
  locale?: string;
}

/** Web Push isn't available here: no service workers, no Push API, or the person said no. */
export class WebPushUnavailableError extends Error {}

/** Whether this browser can take Web Push at all. */
export function webPushSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof window !== 'undefined' && 'PushManager' in window;
}

function fromBase64Url(text: string): Uint8Array {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '=');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function toBase64Url(buffer: ArrayBuffer | null): string {
  const bytes = new Uint8Array(buffer ?? new ArrayBuffer(0));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Subscribes this browser to push (asking the person, when they haven't answered yet) and registers the subscription with the service, so
 * notifications of types with a `push` template reach it. Call it again on each start: registering an existing subscription only refreshes it.
 */
export async function enableWebPush(api: NotificationsApi, options: WebPushOptions): Promise<Device> {
  if (!webPushSupported()) {
    throw new WebPushUnavailableError('This browser has no Web Push.');
  }
  if ((await Notification.requestPermission()) !== 'granted') {
    throw new WebPushUnavailableError('Notifications are not allowed for this site.');
  }
  const registration = await navigator.serviceWorker.register(options.serviceWorkerUrl ?? '/juice-push-sw.js');
  await navigator.serviceWorker.ready;
  const subscription = (await registration.pushManager.getSubscription())
    ?? (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: fromBase64Url(options.vapidPublicKey) as BufferSource }));
  return firstValueFrom(api.registerDevice({
    platform: 'webpush',
    appId: options.appId ?? 'web',
    subscription: { endpoint: subscription.endpoint, p256dh: toBase64Url(subscription.getKey('p256dh')), auth: toBase64Url(subscription.getKey('auth')) },
    locale: options.locale ?? null,
  }));
}

/** On sign-out: removes the registration from the service and unsubscribes this browser. */
export async function disableWebPush(api: NotificationsApi, deviceId: string, serviceWorkerUrl = '/juice-push-sw.js'): Promise<void> {
  await firstValueFrom(api.removeDevice(deviceId));
  if (!webPushSupported()) {
    return;
  }
  const registration = await navigator.serviceWorker.getRegistration(serviceWorkerUrl);
  await (await registration?.pushManager.getSubscription())?.unsubscribe();
}
