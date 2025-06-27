import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageConnexionChercheur } from './page-connexion-chercheur';

describe('PageConnexionChercheur', () => {
  let component: PageConnexionChercheur;
  let fixture: ComponentFixture<PageConnexionChercheur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageConnexionChercheur]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageConnexionChercheur);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
