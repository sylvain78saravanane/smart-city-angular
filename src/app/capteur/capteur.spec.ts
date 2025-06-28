import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Capteur } from './capteur';

describe('Capteur', () => {
  let component: Capteur;
  let fixture: ComponentFixture<Capteur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Capteur]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Capteur);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
