import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageAccueil } from './page-accueil';

describe('PageAccueil', () => {
  let component: PageAccueil;
  let fixture: ComponentFixture<PageAccueil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageAccueil]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageAccueil);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
