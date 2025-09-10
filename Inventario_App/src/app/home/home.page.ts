import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// Ionic standalone
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonItem, IonLabel, IonButton, IonToast
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonList, IonItem, IonLabel, IonButton, IonToast
  ],
})
export class HomePage {
  usuario = 'Usuario';
  isToastOpen = false;
  toastMessage = '';

  constructor(private router: Router) {
    // 1) intentar leer desde el estado de navegación (login)
    const stateEmail = this.router.getCurrentNavigation()?.extras?.state?.['email'];

    this.usuario = stateEmail || 'Usuario';
  }

  // Demo: mostrar toast de “no implementado”
  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }

  // Navegaciones (ajusta rutas reales cuando las tengas)
  goScan() {
    this.showToast('Escaneo de estante: demo pendiente');
    // this.router.navigate(['/scan-estante']);
  }

  goAddProduct() {
    this.showToast('Agregar producto: demo pendiente');
    // this.router.navigate(['/agregar-producto']);
  }

  goSearchProduct() {
    this.showToast('Buscar producto: demo pendiente');
    // this.router.navigate(['/buscar-producto']);
  }

  
}
