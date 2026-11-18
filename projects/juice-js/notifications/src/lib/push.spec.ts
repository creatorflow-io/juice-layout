import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { NotificationsApi } from './notifications-api.service';
import { disableWebPush, enableWebPush, WebPushUnavailableError } from './push';
import { FakeHub, ME, TENANT, jwt, providers } from './testing.spec-helpers';

describe('Web Push', () => {
  let api: NotificationsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: providers(new FakeHub(), jwt({ platform_tenant: TENANT })) });
    api = TestBed.inject(NotificationsApi);
    http = TestBed.inject(HttpTestingController);
  });

  const key = (bytes: number[]) => new Uint8Array(bytes).buffer;
  const subscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/b1',
    getKey: (name: string) => (name === 'p256dh' ? key([4, 250, 251]) : key([1, 2, 3])),
    unsubscribe: jasmine.createSpy('unsubscribe').and.resolveTo(true),
  };

  function fakeServiceWorker(existing: unknown) {
    const pushManager = {
      getSubscription: jasmine.createSpy('getSubscription').and.resolveTo(existing),
      subscribe: jasmine.createSpy('subscribe').and.resolveTo(subscription),
    };
    const registration = { pushManager };
    spyOn(navigator.serviceWorker, 'register').and.resolveTo(registration as unknown as ServiceWorkerRegistration);
    spyOn(navigator.serviceWorker, 'getRegistration').and.resolveTo(registration as unknown as ServiceWorkerRegistration);
    spyOnProperty(navigator.serviceWorker, 'ready', 'get').and.returnValue(Promise.resolve(registration as unknown as ServiceWorkerRegistration));
    return pushManager;
  }

  it('subscribes with the VAPID key and registers the subscription, base64url', async () => {
    spyOn(Notification, 'requestPermission').and.resolveTo('granted');
    const push = fakeServiceWorker(null);

    const enabling = enableWebPush(api, { vapidPublicKey: 'BAEC', locale: 'vi' });
    await new Promise((resolve) => setTimeout(resolve));
    const post = http.expectOne(`${ME}/devices`);
    expect(post.request.body).toEqual({
      platform: 'webpush', appId: 'web', locale: 'vi',
      subscription: { endpoint: 'https://fcm.googleapis.com/fcm/send/b1', p256dh: 'BPr7', auth: 'AQID' },
    });
    post.flush({ id: 'd1', platform: 'webpush', appId: 'web', locale: 'vi', createdAt: 'x', lastSeenAt: 'x' });

    expect((await enabling).id).toBe('d1');
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/juice-push-sw.js');
    const options = push.subscribe.calls.mostRecent().args[0];
    expect(options.userVisibleOnly).toBeTrue();
    expect(Array.from(options.applicationServerKey as Uint8Array)).toEqual([4, 1, 2]);
    http.verify();
  });

  it('refuses without the person\'s permission and registers nothing', async () => {
    spyOn(Notification, 'requestPermission').and.resolveTo('denied');
    await expectAsync(enableWebPush(api, { vapidPublicKey: 'BAEC' })).toBeRejectedWithError(WebPushUnavailableError);
    http.verify();
  });

  it('removes the registration and unsubscribes on sign-out', async () => {
    fakeServiceWorker(subscription);
    const disabling = disableWebPush(api, 'd 1');
    http.expectOne(`${ME}/devices/d%201`).flush(null);
    await disabling;
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });
});
