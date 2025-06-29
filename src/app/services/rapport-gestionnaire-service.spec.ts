import { TestBed } from '@angular/core/testing';

import { RapportGestionnaireService } from './rapport-gestionnaire-service';

describe('RapportGestionnaireService', () => {
  let service: RapportGestionnaireService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RapportGestionnaireService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
