import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LoadingController, IonContent, IonButton, IonInput, IonText, IonToast } from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabaseService/supabase';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, IonButton, IonInput, IonText, ReactiveFormsModule, RouterModule, IonToast]
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

  // 👇 ESTOS GETTERS SON LOS QUE FALTAN
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
    const { email, password } = this.loginForm.getRawValue() as { email: string; password: string; };

    try {
      const loading = await this.loadingCtrl.create({ message: 'Iniciando sesión...', spinner: 'lines' });
      await loading.present();

      const { data, error } = await this.sb.signIn(email, password);

      await loading.dismiss();

      if (error) {
        this.showErrorToast('Credenciales inválidas');
        return;
      }
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
      this.router.navigateByUrl(returnUrl, { replaceUrl: true, state: { email: data.user?.email ?? email } });
    } catch {
      try { await this.loadingCtrl.dismiss(); } catch {}
      this.showErrorToast('No se pudo iniciar sesión');
    }
  }
}
