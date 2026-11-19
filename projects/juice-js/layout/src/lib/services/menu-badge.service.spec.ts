import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MenuBadgeService } from './menu-badge.service';

describe('MenuBadgeService', () => {
  let badges: MenuBadgeService;
  beforeEach(() => { badges = TestBed.inject(MenuBadgeService); });

  it('keeps a count by menu id, a number or a badge with a hint', () => {
    badges.set('a', 2);
    badges.set('b', { count: 3, hint: '3 waiting' });
    expect(badges.get('a')).toEqual({ count: 2, hint: undefined });
    expect(badges.get('b')).toEqual({ count: 3, hint: '3 waiting' });
    expect(badges.get('c')).toBeNull();
    expect(badges.get(null)).toBeNull();
  });

  it('drops a count of zero or less, and null', () => {
    badges.set('a', 2);
    badges.set('a', 0);
    expect(badges.get('a')).toBeNull();
    badges.set('a', 2);
    badges.set('a', null);
    expect(badges.get('a')).toBeNull();
    badges.set('a', -1);
    expect(badges.get('a')).toBeNull();
  });

  it('changes nothing when the same count is set again, so the menu is not redrawn', () => {
    badges.set('a', { count: 2, hint: 'two' });
    const before = badges.get('a');
    badges.set('a', { count: 2, hint: 'two' });
    expect(badges.get('a')).toBe(before);
  });

  it('adds up several entries\' counts and joins their hints', () => {
    const ids = signal<readonly string[]>(['a', 'b', 'c']);
    const total = TestBed.runInInjectionContext(() => badges.total(ids));
    expect(total()).toBeNull();
    badges.set('a', { count: 2, hint: '2 unread' });
    expect(total()).toEqual({ count: 2, hint: '2 unread' });
    badges.set('b', { count: 3, hint: '3 waiting' });
    badges.set('c', 1);
    expect(total()).toEqual({ count: 6, hint: '2 unread; 3 waiting' });
    ids.set(['c']);
    expect(total()).toEqual({ count: 1, hint: undefined });
  });
});
