import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../services/supabaseService/supabase';
import { LocalDbService } from '../services/db-local/db-local';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  // Mock de SupabaseService (solo para que no reviente)
  const supabaseMock = {
    signIn: jasmine.createSpy('signIn').and.returnValue(
      Promise.resolve({
        data: { user: { email: 'test@test.com' } },
        error: null,
      })
    ),
  };

  // Mock de Router
  const routerMock = {
    navigateByUrl: jasmine.createSpy('navigateByUrl'),
  };

  // Mock de base de datos local
  const localDbMock = {
    initDb: jasmine.createSpy('initDb').and.returnValue(Promise.resolve()),
  };

  // Mock de ActivatedRoute
  const activatedRouteMock = {
    snapshot: {
      queryParams: {},
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage], // es standalone
      providers: [
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: LocalDbService, useValue: localDbMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    // Tampoco necesitamos fixture.detectChanges() para estas pruebas básicas
  });

  it('Debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('El formulario debe ser inválido cuando está vacío', () => {
    const form = component.loginForm;
    expect(form.valid).toBeFalse();
  });

  it('Debe ser válido cuando email y password cumplen las reglas', () => {
    const form = component.loginForm;
    form.setValue({
      email: 'test@test.com',
      password: '123456',
    });
    expect(form.valid).toBeTrue();
  });
});
