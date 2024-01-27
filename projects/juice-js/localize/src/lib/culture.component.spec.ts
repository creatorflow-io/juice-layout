import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { CultureComponent } from './culture.component';
import { LocalizeModule } from './localize.module';
import { LocalizeConfig } from './localize.config';

describe('CultureComponent', () => {
  let component: CultureComponent;
  let fixture: ComponentFixture<CultureComponent>;

  beforeEach(() => {
    
    TestBed.configureTestingModule({
      declarations: [CultureComponent],
      imports: [
        TranslateModule.forRoot(),
        LocalizeModule
      ],
      providers:[
        {
            provide: LocalizeConfig,
            useValue: {
              cultureApi: 'http://localhost:3000/cultures',
              localizeApi: 'http://localhost:3000/localize',
              submitMissing: true
            }
        }
      ]
    });
    fixture = TestBed.createComponent(CultureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
