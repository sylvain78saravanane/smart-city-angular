import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitoyenDashboard } from './citoyen-dashboard';

describe('CitoyenDashboard', () => {
  let component: CitoyenDashboard;
  let fixture: ComponentFixture<CitoyenDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitoyenDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CitoyenDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
