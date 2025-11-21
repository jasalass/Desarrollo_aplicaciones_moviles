// src/app/perfil/perfil.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

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
  IonInput,
  IonText,
  IonToast,
  IonSpinner,
} from '@ionic/angular/standalone';

import { SupabaseService, UserProfileMeta } from '../services/supabaseService/supabase';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
    IonInput,
    IonText,
    IonToast,
    IonSpinner,
  ],
})
export class PerfilPage {
  profile: UserProfileMeta | null = null;

  profileForm: FormGroup;
  isLoadingProfile = false;
  isSaving = false;

  // Toast
  isToastOpen = false;
  toastMessage = '';
  toastColor: 'primary' | 'success' | 'danger' | 'medium' = 'medium';

  constructor(
    private fb: FormBuilder,
    private sb: SupabaseService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.cargarUsuario();
  }

  get firstNameCtrl() { return this.profileForm.get('first_name'); }
  get lastNameCtrl() { return this.profileForm.get('last_name'); }

  get displayName(): string {
    if (this.profile?.first_name || this.profile?.last_name) {
      return `${this.profile?.first_name ?? ''} ${this.profile?.last_name ?? ''}`.trim();
    }
    return this.profile?.email || 'Usuario inventario';
  }

  get displayInitial(): string {
    if (this.profile?.first_name && this.profile.first_name.length > 0) {
      return this.profile.first_name[0].toUpperCase();
    }
    if (this.profile?.email && this.profile.email.length > 0) {
      return this.profile.email[0].toUpperCase();
    }
    return 'U';
  }

  private openToast(msg: string, color: 'primary' | 'success' | 'danger' | 'medium' = 'medium') {
    this.toastMessage = msg;
    this.toastColor = color;
    this.isToastOpen = true;
  }

  async cargarUsuario() {
    this.isLoadingProfile = true;
    try {
      const p = await this.sb.getCurrentUserProfile();
      this.profile = p;

      this.profileForm.patchValue({
        first_name: p?.first_name ?? '',
        last_name: p?.last_name ?? '',
      });
    } catch (e) {
      console.error('Error al cargar perfil:', e);
      this.openToast('No se pudo cargar el perfil', 'danger');
    } finally {
      this.isLoadingProfile = false;
    }
  }

  async onSaveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.openToast('Revisa los campos del formulario', 'danger');
      return;
    }

    const { first_name, last_name } = this.profileForm.getRawValue() as {
      first_name: string; last_name: string;
    };

    this.isSaving = true;
    try {
      await this.sb.updateProfileName(first_name.trim(), last_name.trim());
      await this.cargarUsuario();
      this.openToast('Perfil actualizado correctamente', 'success');
    } catch (e) {
      console.error('Error al actualizar perfil:', e);
      this.openToast('No se pudo actualizar el perfil', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  async logout() {
    try {
      await this.sb.signOut();
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    } finally {
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }
}
