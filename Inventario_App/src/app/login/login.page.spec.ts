import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginPage } from './login.page';
import { ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../services/supabaseService/supabase';
import { IonicModule, LoadingController } from '@ionic/angular';

// ==== mocks ==== //
class SupabaseServiceMock {
 
  signIn(email: string, password: string): Promise<any> {
    return Promise.resolve({
      data: { user: { email } },
      error: null,
    });
  }
}

class RouterMock {
  navigateByUrl = jasmine.createSpy('navigateByUrl');
}

class LoadingCtrlMock {
  create() {
    return Promise.resolve({
      present: () => Promise.resolve(),
      dismiss: () => Promise.resolve(),
    });
  }
}

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let supabaseService: any;  
  let router: RouterMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginPage,
        ReactiveFormsModule,
        IonicModule.forRoot(),
      ],
      providers: [
        { provide: SupabaseService, useClass: SupabaseServiceMock },
        { provide: Router, useClass: RouterMock },
        { provide: LoadingController, useClass: LoadingCtrlMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;

    supabaseService = TestBed.inject(SupabaseService);
    router = TestBed.inject(Router) as any;

    fixture.detectChanges();
  });

  // ==========================================================
  //              PRUEBAS UNITARIAS DEL COMPONENTE LOGIN
  // ==========================================================

  it('Debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('El formulario debe ser inválido cuando está vacío', () => {
    component.loginForm.setValue({ email: '', password: '' });
    expect(component.loginForm.valid).toBeFalse();
  });

  it('Debe ser válido cuando email y password cumplen las reglas', () => {
    component.loginForm.setValue({
      email: 'usuario@test.com',
      password: '123456',
    });
    expect(component.loginForm.valid).toBeTrue();
  });

  it('Debe marcar error si el email no es válido', () => {
    const emailCtrl = component.emailCtrl!;
    emailCtrl.setValue('invalido');
    expect(emailCtrl.invalid).toBeTrue();
  });

  it('Debe llamar a SupabaseService.signIn al enviar el formulario', fakeAsync(async () => {
    const spy = spyOn(supabaseService, 'signIn').and.callThrough();

    component.loginForm.setValue({
      email: 'test@test.com',
      password: 'abcdef',
    });

    await component.onSubmit();
    tick();

    expect(spy).toHaveBeenCalledTimes(1);
  }));

  it('Debe navegar al home cuando el login es exitoso', fakeAsync(async () => {
    component.loginForm.setValue({
      email: 'test@test.com',
      password: 'abcdef',
    });

    await component.onSubmit();
    tick();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/home', { replaceUrl: true });
  }));

  it('Debe manejar error cuando Supabase devuelve error', fakeAsync(async () => {
    // 👇 aquí ahora es válido devolver data:null y error:{...}
    spyOn(supabaseService, 'signIn').and.returnValue(
      Promise.resolve({
        data: null,
        error: { message: 'Credenciales incorrectas' },
      }),
    );

    component.loginForm.setValue({
      email: 'bad@test.com',
      password: '123456',
    });

    await component.onSubmit();
    tick();

    expect(component.toastMessage).toContain('Credenciales incorrectas');
  }));
});
