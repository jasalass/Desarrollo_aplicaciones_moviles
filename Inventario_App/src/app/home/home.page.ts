import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonItem, IonLabel, IonButton, IonToast
} from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabase';

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

  constructor(private router: Router, private sb: SupabaseService) {
    const stateEmail = this.router.getCurrentNavigation()?.extras?.state?.['email'];
    if (stateEmail) {
      this.usuario = stateEmail;
    } else {
      // fallback: leer de la sesión
      this.sb.client.auth.getUser().then(({ data }) => {
        if (data.user?.email) this.usuario = data.user.email;
      });
    }
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }

  goScan() { this.showToast('Escaneo de estante: demo pendiente'); }
  goAddProduct() { this.showToast('Agregar producto: demo pendiente'); }
  goSearchProduct() { this.showToast('Buscar producto: demo pendiente'); }
}
