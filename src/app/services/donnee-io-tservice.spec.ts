import { TestBed } from '@angular/core/testing';

import { DonneeIoTService } from './donnee-io-tservice';

describe('DonneeIoTService', () => {
  let service: DonneeIoTService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DonneeIoTService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
