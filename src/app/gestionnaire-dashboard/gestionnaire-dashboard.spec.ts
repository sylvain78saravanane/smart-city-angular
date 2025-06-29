import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionnaireDashboard } from './gestionnaire-dashboard';

describe('GestionnaireDashboard', () => {
  let component: GestionnaireDashboard;
  let fixture: ComponentFixture<GestionnaireDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionnaireDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionnaireDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
