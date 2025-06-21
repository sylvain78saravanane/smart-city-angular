import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageConnexionAdmin } from './page-connexion-admin';

describe('PageConnexionAdmin', () => {
  let component: PageConnexionAdmin;
  let fixture: ComponentFixture<PageConnexionAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageConnexionAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageConnexionAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
