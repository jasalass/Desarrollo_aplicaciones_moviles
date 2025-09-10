import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonToast, IonInput, IonText, IonButton } from '@ionic/angular/standalone';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-recuperar-password',
  templateUrl: './recuperar-password.page.html',
  styleUrls: ['./recuperar-password.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, ReactiveFormsModule, RouterModule, IonToast, IonInput, IonText, IonButton]
})
export class RecuperarPasswordPage implements OnInit {
  // referencia al formulario reactivo
  recuperarForm: FormGroup;
  isToastOpen = false;
  toastMessage: string = "";

  // función para mostrar un toast con mensaje personalizado
  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }

  constructor(private fb: FormBuilder, private router: Router) {
    // Construcción del formulario con validaciones integradas de Angular
    this.recuperarForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,   // El campo no puede quedar vacío
          Validators.email       // Valida formato usuario@dominio
        ]
      ]
    });
  }

  // Getters para acceder fácilmente a los controles desde el template
  get emailCtrl() { return this.recuperarForm.get('email'); }


  ngOnInit() {
    // Si no existe la clave "usuarios" en localStorage, la inicializamos como arreglo vacío
    if (!localStorage.getItem('usuarios')) {
      localStorage.setItem('usuarios', JSON.stringify([]));
    }
  }


  onSubmit() {
    // Si el formulario es inválido, marcamos todos los campos como "tocados"
    // Esto hace que se muestren los mensajes de error
    if (this.recuperarForm.invalid) {
      this.recuperarForm.markAllAsTouched();
      return;
    }

    // Extraemos email y password del formulario
    const { email } = this.recuperarForm.value;

    // Obtenemos la lista de usuarios guardados
    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');


    const usuario = usuarios.find((u: any) => u.email === email);

    if (usuario) {
      //  Coinciden email 
        alert("Correo de recuperación enviado")
        this.router.navigate(['/login']);
      

    }  else {      //  No existe ese email en usuarios
      this.showToast("Usuario no registrado");
    }
  }
}
