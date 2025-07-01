import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChercheurDashboard } from './chercheur-dashboard';

describe('ChercheurDashboard', () => {
  let component: ChercheurDashboard;
  let fixture: ComponentFixture<ChercheurDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChercheurDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChercheurDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
