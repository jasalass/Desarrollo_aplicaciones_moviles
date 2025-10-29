import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonToast
} from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabaseService/supabase';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonToast
  ],
})
export class HomePage {
  usuario = 'Usuario';
  isToastOpen = false;
  toastMessage = '';

  constructor(private router: Router, private sb: SupabaseService) {
    this.sb.currentUserEmail().then(email => { if (email) this.usuario = email; });
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }

  goScan() { this.router.navigateByUrl('/scan'); }
  goAddProduct() { this.router.navigateByUrl('/agregar-producto'); }
  goSearchProduct() { this.showToast('Buscar producto: pendiente'); }
}
