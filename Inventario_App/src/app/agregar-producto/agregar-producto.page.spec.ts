import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgregarProductoPage } from './agregar-producto.page';
import { ReactiveFormsModule } from '@angular/forms';

describe('AgregarProductoPage', () => {
  let component: AgregarProductoPage;
  let fixture: ComponentFixture<AgregarProductoPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AgregarProductoPage,     // componente standalone
        ReactiveFormsModule,     // por si el constructor crea el form
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarProductoPage);
    component = fixture.componentInstance;
    // NO llamamos a fixture.detectChanges() para no montar la plantilla completa
  });

  it('Debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
