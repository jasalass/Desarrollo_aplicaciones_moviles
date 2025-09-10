import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// ReactiveFormsModule nos permite usar formularios reactivos en Angular
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// Ionic Standalone Components
import { IonContent, IonButton, IonInput, IonText, IonToast, IonLoading } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, IonButton, IonInput, IonText, ReactiveFormsModule, RouterModule, IonToast, IonLoading] // Módulos que usaremos en el template
})
export class LoginPage {
  // referencia al formulario reactivo
  loginForm: FormGroup;
  isToastOpen = false;
  toastMessage: string = "";

  // función para mostrar un toast con mensaje personalizado
  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }

  constructor(private fb: FormBuilder, private router: Router) {
    // Construcción del formulario con validaciones integradas de Angular
    this.loginForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,   // El campo no puede quedar vacío
          Validators.email       // Valida formato usuario@dominio
        ]
      ],
      password: [
        '',
        [
          Validators.required,   // La contraseña no puede estar vacía
          Validators.minLength(6), // Mínimo 6 caracteres
          Validators.maxLength(12)  // Máximo 12 caracteres
        ]
      ]
    });
  }

  // Getters para acceder fácilmente a los controles desde el template
  get emailCtrl() { return this.loginForm.get('email'); }
  get passwordCtrl() { return this.loginForm.get('password'); }

  ngOnInit() {
    // Si no existe la clave "usuarios" en localStorage, la inicializamos como arreglo vacío
    if (!localStorage.getItem('usuarios')) {
      localStorage.setItem('usuarios', JSON.stringify([]));
    }

    let sesion = JSON.parse(localStorage.getItem('sesion') || 'false');
    console.log(sesion)

    if (sesion){
      this.router.navigateByUrl('/home');
    }
  }


  onSubmit() {
    // Si el formulario es inválido, marcamos todos los campos como "tocados"
    // Esto hace que se muestren los mensajes de error
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    

    // Extraemos email y password del formulario
    const { email, password } = this.loginForm.value;

    // Obtenemos la lista de usuarios guardados
    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');


    const usuario = usuarios.find((u: any) => u.email === email);

    if (usuario && usuario.password === password) {
      //  Coinciden email y password
      localStorage.setItem('sesion', JSON.stringify(true));
      this.router.navigateByUrl('/home', {
        state: { email: this.loginForm.value.email }
      });
    } else if (usuario) {
      //  Email existe pero la password no coincide
      this.showToast("Credenciales inválidas");
    } else {
      //  No existe ese email en usuarios
      this.showToast("Usuario no registrado");
    }
  }
}
