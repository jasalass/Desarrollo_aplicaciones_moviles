// src/app/login/login.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import {
  LoadingController,
  IonContent,
  IonButton,
  IonInput,
  IonText,
  IonToast
} from '@ionic/angular/standalone';
import { SupabaseService, UserProfileMeta } from '../services/supabaseService/supabase';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    IonButton,
    IonInput,
    IonText,
    ReactiveFormsModule,
    RouterModule,
    IonToast
  ]
})
export class LoginPage {
  loginForm: FormGroup;
  isToastOpen = false;
  toastMessage = '';
  toastDuration = 2200;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private sb: SupabaseService,
    private loadingCtrl: LoadingController
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(12)]],
    });
  }

  get emailCtrl() { return this.loginForm.get('email'); }
  get passwordCtrl() { return this.loginForm.get('password'); }

  private showErrorToast(msg: string, duration = 2200) {
    this.toastMessage = msg;
    this.toastDuration = duration;
    this.isToastOpen = true;
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } =
      this.loginForm.getRawValue() as { email: string; password: string; };

    let loading: HTMLIonLoadingElement | null = null;

    try {
      loading = await this.loadingCtrl.create({
        message: 'Iniciando sesión...',
        spinner: 'lines'
      });
      await loading.present();

      const { data, error } = await this.sb.signIn(email, password);

      if (error || !data?.user) {
        await loading.dismiss();
        this.showErrorToast(error?.message || 'Credenciales inválidas');
        return;
      }

      // ===== Aquí usamos metadata “completa” =====
      const profile: UserProfileMeta | null = await this.sb.getCurrentUserProfile();

      await loading.dismiss();

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';

      this.router.navigateByUrl(returnUrl, {
        replaceUrl: true,
        state: {
          email: profile?.email ?? email,
          firstName: profile?.first_name ?? null,
          lastName: profile?.last_name ?? null,
        },
      });

    } catch (e: any) {
      if (loading) {
        try { await loading.dismiss(); } catch {}
      }
      console.error('Error en onSubmit login:', e);
      this.showErrorToast(e?.message ?? 'No se pudo iniciar sesión');
    }
  }
}
