import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageConnexion } from './page-connexion';

describe('PageConnexion', () => {
  let component: PageConnexion;
  let fixture: ComponentFixture<PageConnexion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageConnexion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageConnexion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
