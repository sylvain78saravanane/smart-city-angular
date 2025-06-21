import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MentionsLegales } from './mentions-legales';

describe('MentionsLegales', () => {
  let component: MentionsLegales;
  let fixture: ComponentFixture<MentionsLegales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MentionsLegales]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MentionsLegales);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
