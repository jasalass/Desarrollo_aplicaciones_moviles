// src/app/perfil/perfil.page.spec.ts
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { PerfilPage } from './perfil.page';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonSpinner,
  IonText,
  IonToast,
} from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabaseService/supabase';

describe('PerfilPage', () => {
  let component: PerfilPage;
  let fixture: ComponentFixture<PerfilPage>;

  const supabaseStub = {
    getCurrentUserProfile: jasmine
      .createSpy('getCurrentUserProfile')
      .and.resolveTo({
        id: '123',
        email: 'test@correo.com',
        first_name: 'Juan',
        last_name: 'Salas',
      }),
    updateProfileName: jasmine
      .createSpy('updateProfileName')
      .and.resolveTo(undefined),
    signOut: jasmine.createSpy('signOut').and.resolveTo(undefined),
  };

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          PerfilPage,              // standalone component
          ReactiveFormsModule,
          IonContent,
          IonHeader,
          IonToolbar,
          IonTitle,
          IonCard,
          IonCardHeader,
          IonCardTitle,
          IonCardContent,
          IonButton,
          IonSpinner,
          IonText,
          IonToast,
        ],
        providers: [
          { provide: SupabaseService, useValue: supabaseStub },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(PerfilPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
    })
  );

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  it('debería tener el formulario de perfil creado', () => {
    expect(component['profileForm']).toBeTruthy();
  });

  it('no debería llamar updateProfileName si el formulario es inválido', async () => {
    // Dejamos los campos vacíos para que sea inválido
    const form = component['profileForm'];
    form.patchValue({ first_name: '', last_name: '' });

    await component.onSaveProfile();

    expect(supabaseStub.updateProfileName).not.toHaveBeenCalled();
  });
});
