// src/app/home/home.page.ts
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

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
  IonToast,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
} from '@ionic/angular/standalone';

import { SupabaseService, UserProfileMeta } from '../services/supabaseService/supabase';
import { SyncService } from '../services/syncService/sync-service';
import { addIcons } from 'ionicons';
import {
  qrCodeOutline,
  cubeOutline,
  searchOutline,
  syncOutline,
  businessOutline,
  personCircleOutline,
  logOutOutline,
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
    CommonModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonToast,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
  ],
})
export class HomePage {
  // Perfil de usuario
  profile: UserProfileMeta | null = null;
  isLoadingProfile = false;

  // Texto de bienvenida
  get displayName(): string {
    if (this.profile?.first_name || this.profile?.last_name) {
      const full = `${this.profile?.first_name ?? ''} ${this.profile?.last_name ?? ''}`.trim();
      return full || (this.profile?.email ?? 'Usuario inventario');
    }
    return this.profile?.email ?? 'Usuario inventario';
  }

  get avatarLetter(): string {
    if (this.profile?.first_name && this.profile.first_name.length > 0) {
      return this.profile.first_name[0].toUpperCase();
    }
    if (this.profile?.email && this.profile.email.length > 0) {
      return this.profile.email[0].toUpperCase();
    }
    return 'U';
  }

  // Toast
  isToastOpen = false;
  toastMessage = '';

  // Bodegas
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
      businessOutline,
      personCircleOutline,
      logOutOutline,
    });

    this.loadUserProfile();
    this.loadWarehouses();
  }

  private openToast(msg: string, duration = 2000) {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }

  // === Perfil ===
  async loadUserProfile() {
    this.isLoadingProfile = true;
    try {
      const p = await this.sb.getCurrentUserProfile();
      this.profile = p;
    } catch (e) {
      console.error('Error al cargar perfil en Home:', e);
      this.openToast('No se pudo cargar el usuario');
    } finally {
      this.isLoadingProfile = false;
    }
  }

  goPerfil() {
    this.router.navigateByUrl('/perfil');
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

  // === Navegación principal ===
  goScan() {
    this.router.navigateByUrl('/scan');
  }

  goAddProduct() {
    this.router.navigateByUrl('/agregar-producto');
  }

  goSearchProduct() {
    this.router.navigateByUrl('/buscar-producto');
  }

  // === Sincronización Supabase → SQLite ===
  async syncInventario() {
    try {
      await this.syncService.syncAll();
      this.openToast('Inventario sincronizado correctamente');
      await this.loadWarehouses();
    } catch (e: any) {
      console.error('Error en syncInventario:', e);
      this.openToast('Error: ' + (e?.message ?? JSON.stringify(e)));
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
      this.openToast('No se pudieron cargar las bodegas');
    } finally {
      this.isLoadingWarehouses = false;
    }
  }

  
}
