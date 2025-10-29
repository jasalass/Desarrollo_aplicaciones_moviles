import { TestBed } from '@angular/core/testing';

import { DbLocal } from './db-local';

describe('DbLocal', () => {
  let service: DbLocal;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DbLocal);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
