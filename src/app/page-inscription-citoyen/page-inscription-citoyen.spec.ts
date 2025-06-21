import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageInscriptionCitoyen } from './page-inscription-citoyen';

describe('PageInscriptionCitoyen', () => {
  let component: PageInscriptionCitoyen;
  let fixture: ComponentFixture<PageInscriptionCitoyen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageInscriptionCitoyen]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageInscriptionCitoyen);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
