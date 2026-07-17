import { isSearchablePage, SearchablePage } from './searchable-page';

describe('isSearchablePage', () => {
  it('accepts an object with an onSearch method', () => {
    const page: SearchablePage = { onSearch: () => {} };
    expect(isSearchablePage(page)).toBe(true);
  });

  it('accepts a class instance that implements the contract', () => {
    class OrdersComponent implements SearchablePage {
      onSearch(_query: string): void {}
    }
    expect(isSearchablePage(new OrdersComponent())).toBe(true);
  });

  it('rejects null and undefined', () => {
    expect(isSearchablePage(null)).toBe(false);
    expect(isSearchablePage(undefined)).toBe(false);
  });

  it('rejects primitives', () => {
    expect(isSearchablePage('onSearch')).toBe(false);
    expect(isSearchablePage(42)).toBe(false);
    expect(isSearchablePage(true)).toBe(false);
  });

  it('rejects a page that declares nothing', () => {
    expect(isSearchablePage({})).toBe(false);
    // A page with no search support is the default — FR-003.
    class PlainComponent {}
    expect(isSearchablePage(new PlainComponent())).toBe(false);
  });

  it('rejects an object whose onSearch is not a function', () => {
    // Guards the failure FR-009 forbids: declaring support without handling it.
    expect(isSearchablePage({ onSearch: true })).toBe(false);
    expect(isSearchablePage({ onSearch: 'yes' })).toBe(false);
    expect(isSearchablePage({ onSearch: null })).toBe(false);
  });
});
