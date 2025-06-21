import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagePlan } from './page-plan';

describe('PagePlan', () => {
  let component: PagePlan;
  let fixture: ComponentFixture<PagePlan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagePlan]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagePlan);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
