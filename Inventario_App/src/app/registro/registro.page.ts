import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// ReactiveFormsModule nos permite usar formularios reactivos en Angular
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// Ionic Standalone Components
import { IonContent, IonButton, IonInput, IonText, IonToast } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [IonToast,IonContent, CommonModule, IonButton, IonInput, IonText, ReactiveFormsModule, RouterModule]
})
export class RegistroPage {

  // referencia al formulario reactivo
  registerForm: FormGroup;
  toastMessage: string = "";
  isToastOpen: boolean=false;

  // función para mostrar un toast con mensaje personalizado
  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }

  constructor(private fb: FormBuilder, private router: Router) {
    // Construcción del formulario con validaciones integradas de Angular
    this.registerForm = this.fb.group({
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
  get emailCtrl() { return this.registerForm.get('email'); }
  get passwordCtrl() { return this.registerForm.get('password'); }

  ngOnInit() {
    // Si no existe la clave "usuarios" en localStorage, la inicializamos como arreglo vacío
    if (!localStorage.getItem('usuarios')) {
      localStorage.setItem('usuarios', JSON.stringify([]));
    }
  }

 
  onSubmit() {
    // Si el formulario es inválido, marcamos todos los campos como "tocados"
    // Esto hace que se muestren los mensajes de error
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    // Extraemos email y password del formulario
    const { email, password } = this.registerForm.value;

    // Obtenemos la lista de usuarios guardados
    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');

    // Evitamos registrar correos duplicados
    if (usuarios.some((u: any) => u.email === email)) {
      this.showToast('Este correo ya está registrado');
      return;
    }else {
      // Creamos un objeto usuario y lo añadimos a la lista
      usuarios.push({ email, password, sesion:false });
      localStorage.setItem('usuarios', JSON.stringify(usuarios));
      this.router.navigate(['/login']);
    } 
  }

}
