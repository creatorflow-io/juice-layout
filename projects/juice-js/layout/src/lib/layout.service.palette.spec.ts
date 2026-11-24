import { TestBed } from '@angular/core/testing';

import { LayoutService } from './layout.service';
import { LayoutConfig } from './layout.config';

describe('LayoutService palettes', () => {
  const create = (config: Partial<LayoutConfig> = {}) => {
    TestBed.configureTestingModule({ providers: [{ provide: LayoutConfig, useValue: new LayoutConfig({ brand: 'x', ...config }) }] });
    return TestBed.inject(LayoutService);
  };
  const attribute = () => document.documentElement.getAttribute('data-juice-palette');

  const reset = () => {
    localStorage.removeItem(LayoutService.PALETTE);
    document.documentElement.removeAttribute('data-juice-palette');
  };
  beforeEach(reset);
  afterEach(reset);

  it('sets no attribute without a choice or a default, so the stylesheet default applies', () => {
    const service = create();
    expect(service.palette()).toBeNull();
    expect(attribute()).toBeNull();
  });

  it('applies the configured default', () => {
    create({ defaultPalette: 'indigo' });
    expect(attribute()).toBe('indigo');
  });

  it('switches, remembers the choice, and the next start applies it over the default', () => {
    const service = create({ defaultPalette: 'teal' });
    service.setPalette('indigo');
    expect(service.palette()).toBe('indigo');
    expect(attribute()).toBe('indigo');
    expect(localStorage.getItem(LayoutService.PALETTE)).toBe('indigo');

    TestBed.resetTestingModule();
    document.documentElement.removeAttribute('data-juice-palette');
    create({ defaultPalette: 'teal' });
    expect(attribute()).toBe('indigo');
  });

  it('null goes back to the default and forgets the choice', () => {
    const service = create({ defaultPalette: 'teal' });
    service.setPalette('indigo');
    service.setPalette(null);
    expect(attribute()).toBe('teal');
    expect(localStorage.getItem(LayoutService.PALETTE)).toBeNull();
  });

  it('ignores a remembered palette the app no longer offers', () => {
    localStorage.setItem(LayoutService.PALETTE, 'removed');
    create({ defaultPalette: 'teal' });
    expect(attribute()).toBe('teal');
  });

  it('offers the built-in palettes when the config has none', () => {
    TestBed.configureTestingModule({ providers: [{ provide: LayoutConfig, useValue: { brand: 'x' } }] });
    expect(TestBed.inject(LayoutService).palettes().map(p => p.id)).toEqual(['teal', 'indigo']);
  });
});
