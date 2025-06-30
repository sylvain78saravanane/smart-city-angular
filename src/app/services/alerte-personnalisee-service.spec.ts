import { TestBed } from '@angular/core/testing';

import { AlertePersonnaliseeService } from './alerte-personnalisee-service';

describe('AlertePersonnaliseeService', () => {
  let service: AlertePersonnaliseeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlertePersonnaliseeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
