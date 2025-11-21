import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonToast, IonIcon, IonList, IonItem, IonLabel, IonSpinner
} from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabaseService/supabase';
import { SyncService } from '../services/syncService/sync-service';
import { addIcons } from 'ionicons';
import {
  qrCodeOutline,
  cubeOutline,
  searchOutline,
  syncOutline,
  businessOutline
} from 'ionicons/icons';

interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  comments?: string | null;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonToast, IonIcon, IonList, IonItem, IonLabel, IonSpinner
  ],
})
export class HomePage {
  usuario = 'Usuario';
  isToastOpen = false;
  toastMessage = '';

  warehouses: Warehouse[] = [];
  isLoadingWarehouses = false;

  constructor(
    private router: Router,
    private sb: SupabaseService,
    private syncService: SyncService,
  ) {
    addIcons({
      qrCodeOutline,
      cubeOutline,
      searchOutline,
      syncOutline,
      businessOutline
    });

    // Email del usuario logueado
    this.sb.currentUserEmail().then(email => {
      if (email) this.usuario = email;
    });

    // Cargar bodegas al entrar
    this.loadWarehouses();
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }

  // === Navegación principal ===
  goScan() {
    this.router.navigateByUrl('/scan');
  }

  goAddProduct() {
    this.router.navigateByUrl('/agregar-producto');
  }

  goSearchProduct() {
    this.showToast('Buscar producto: pendiente');
  }

  // === Sincronización Supabase → SQLite ===
  async syncInventario() {
    try {
      await this.syncService.syncAll();
      this.showToast('Inventario sincronizado correctamente');
      await this.loadWarehouses();
    } catch (e: any) {
      console.error('Error en syncInventario:', e);
      this.showToast('Error: ' + (e?.message ?? JSON.stringify(e)));
    }
  }


  // === Carga de bodegas desde Supabase (API REST vía SDK) ===
  async loadWarehouses() {
    this.isLoadingWarehouses = true;
    try {
      const { data, error } = await this.sb.sdk
        .from('warehouses')
        .select('id, code, name, address, comments')
        .eq('deleted', false)
        .order('code', { ascending: true });

      if (error) throw error;

      this.warehouses = (data ?? []) as Warehouse[];
    } catch (e) {
      console.error(e);
      this.showToast('No se pudieron cargar las bodegas');
    } finally {
      this.isLoadingWarehouses = false;
    }
  }
}
