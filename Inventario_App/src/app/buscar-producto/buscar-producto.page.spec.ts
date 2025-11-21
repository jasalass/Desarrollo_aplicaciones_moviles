import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuscarProductoPage } from './buscar-producto.page';

describe('BuscarProductoPage', () => {
  let component: BuscarProductoPage;
  let fixture: ComponentFixture<BuscarProductoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BuscarProductoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
