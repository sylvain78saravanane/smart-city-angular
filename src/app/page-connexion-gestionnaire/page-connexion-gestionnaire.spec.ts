import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageConnexionGestionnaire } from './page-connexion-gestionnaire';

describe('PageConnexionGestionnaire', () => {
  let component: PageConnexionGestionnaire;
  let fixture: ComponentFixture<PageConnexionGestionnaire>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageConnexionGestionnaire]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageConnexionGestionnaire);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
