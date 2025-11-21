import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonSpinner,
  IonToast,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonInput,
} from '@ionic/angular/standalone';

import { SyncService } from '../services/syncService/sync-service';
import { ScannerService } from '../services/scannerService/scanner-service';
import { LocalDbService } from '../services/db-local/db-local';

import { addIcons } from 'ionicons';
import {
  qrCodeOutline,
  cubeOutline,
  alertCircleOutline,
  addCircleOutline,
  createOutline,
  trashOutline,
  searchOutline,
} from 'ionicons/icons';

type ShelfRow = {
  id: string;
  code: string;
  name: string;
  area?: string | null;
};

type ShelfProductRow = {
  productId: string;
  code: string;
  name: string;
  quantity: number;
};

type ProductSuggestion = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  min_stock: number;
};

type PendingItem = {
  code: string;
  name: string;
  description?: string | null;
  minStock: number;
  quantity: number;
};

@Component({
  selector: 'app-scan',
  standalone: true,
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonText,
    IonSpinner,
    IonToast,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonInput,
  ],
})
export class ScanPage {
  isScanningShelf = false;
  isScanningProduct = false;

  lastQrContent: string | null = null;

  shelf: ShelfRow | null = null;
  shelfProducts: ShelfProductRow[] = [];

  addMode: 'qr' | 'form' = 'qr';

  productForm: FormGroup;
  suggestions: ProductSuggestion[] = [];
  isSearching = false;
  editingIndex: number | null = null;

  pendingItems: PendingItem[] = [];

  isToastOpen = false;
  toastMessage = '';

  constructor(
    private scanner: ScannerService,
    private db: LocalDbService,
    private fb: FormBuilder,
    private sync: SyncService
  ) {
    addIcons({
      qrCodeOutline,
      cubeOutline,
      alertCircleOutline,
      addCircleOutline,
      createOutline,
      trashOutline,
      searchOutline,
    });

    this.productForm = this.fb.group({
      search: [''],
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      minStock: [0],
      quantity: [1, [Validators.required, Validators.min(1)]],
    });
  }

  // ──────────────────────────────────────────────────────────
  // Toast utilitario
  // ──────────────────────────────────────────────────────────
  private openToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }

  // ──────────────────────────────────────────────────────────
  // Consultar productos del estante
  // ──────────────────────────────────────────────────────────
  private async refreshShelfProducts() {
    if (!this.shelf) return;

    const rows = await this.db.query<ShelfProductRow>(
      `SELECT
        p.id   AS productId,
        p.code AS code,
        p.name AS name,
        pl.quantity AS quantity
       FROM product_locations pl
       JOIN products p ON p.id = pl.product_id
       WHERE pl.shelf_id = ?
         AND pl.deleted = 0
         AND p.deleted = 0
       ORDER BY p.name`,
      [this.shelf.id]
    );

    this.shelfProducts = rows;
  }

  // ──────────────────────────────────────────────────────────
  // 1) Escanear estante
  // ──────────────────────────────────────────────────────────
  async scanShelf() {
    this.isScanningShelf = true;
    this.shelf = null;
    this.shelfProducts = [];
    this.lastQrContent = null;
    this.pendingItems = [];
    this.editingIndex = null;

    try {
      const qr = await this.scanner.scanOnce();

      if (!qr) {
        this.openToast('No se detectó ningún código QR de estante.');
        return;
      }

      this.lastQrContent = qr;
      await this.db.saveScan(qr);

      const shelfRows = await this.db.query<ShelfRow>(
        `SELECT id, code, name, area
         FROM shelves
         WHERE qr_text = ?
         LIMIT 1`,
        [qr]
      );

      if (!shelfRows.length) {
        this.openToast('El QR no corresponde a un estante registrado.');
        return;
      }

      this.shelf = shelfRows[0];
      await this.refreshShelfProducts();
    } catch (err) {
      console.error(err);
      this.openToast('No se pudo completar el escaneo de estante.');
    } finally {
      this.isScanningShelf = false;
    }
  }

  // ──────────────────────────────────────────────────────────
  // 2) Eliminar producto asignado al estante
  // ──────────────────────────────────────────────────────────
  async removeProductFromShelf(item: ShelfProductRow) {
    if (!this.shelf) return;

    try {
      await this.db.removeProductFromShelf(item.productId, this.shelf.id);
      await this.refreshShelfProducts();

      try {
        await this.sync.syncAll();
      } catch {}

      this.openToast('Producto eliminado y sincronizado.');
    } catch (e) {
      console.error(e);
      this.openToast('No se pudo eliminar el producto.');
    }
  }

  // ──────────────────────────────────────────────────────────
  // 3) Agregar producto por QR
  // ──────────────────────────────────────────────────────────
  async scanProductQr() {
    if (!this.shelf) return this.openToast('Primero escanea un estante.');

    this.isScanningProduct = true;

    try {
      const qr = await this.scanner.scanOnce();
      if (!qr) return this.openToast('No se detectó QR de producto.');

      let code = '';
      let name = '';

      if (qr.includes('|')) {
        const parts = qr.split('|');
        code = parts[1] ?? '';
        name = parts[2] ?? '';
      } else {
        code = qr;
      }

      if (!code) return this.openToast('El QR no es válido.');

      const productId = await this.db.upsertProductByCode(
        code,
        name || `Producto ${code}`,
        null,
        0
      );

      await this.db.addOrUpdateLocation(productId, this.shelf.id, 1);
      await this.refreshShelfProducts();

      try {
        await this.sync.syncAll();
        this.openToast(`Producto ${code} agregado y sincronizado.`);
      } catch {
        this.openToast(`Producto ${code} agregado, pero falló sincronización.`);
      }
    } catch (err) {
      console.error(err);
      this.openToast('Error al agregar producto por QR.');
    } finally {
      this.isScanningProduct = false;
    }
  }

  // ──────────────────────────────────────────────────────────
  // 4) Cambio de modo (QR o formulario)
  // ──────────────────────────────────────────────────────────
  onModeChange(e: any) {
    const v = e?.detail?.value;
    this.addMode = v === 'form' ? 'form' : 'qr';
  }

  // ──────────────────────────────────────────────────────────
  // Sugerencias de producto
  // ──────────────────────────────────────────────────────────
  async onSearchChange(ev: any) {
    const term = (ev?.detail?.value || '').trim();

    if (term.length < 2) {
      this.suggestions = [];
      return;
    }

    this.isSearching = true;
    try {
      this.suggestions = await this.db.searchProducts(term);
    } catch {
      this.suggestions = [];
    } finally {
      this.isSearching = false;
    }
  }

  selectSuggestion(s: ProductSuggestion) {
    this.productForm.patchValue({
      code: s.code,
      name: s.name,
      description: s.description ?? '',
      minStock: s.min_stock,
    });
    this.suggestions = [];
  }

  // ──────────────────────────────────────────────────────────
  // Manejo de productos pendientes
  // ──────────────────────────────────────────────────────────
  addPendingItem() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return this.openToast('Faltan campos requeridos.');
    }

    const { code, name, description, minStock, quantity } =
      this.productForm.getRawValue();

    const item: PendingItem = {
      code: code.trim(),
      name: name.trim(),
      description: description?.trim() || null,
      minStock,
      quantity,
    };

    if (this.editingIndex !== null) {
      this.pendingItems[this.editingIndex] = item;
      this.editingIndex = null;
    } else {
      this.pendingItems.push(item);
    }

    this.productForm.reset({
      code: '',
      name: '',
      description: '',
      minStock: 0,
      quantity: 1,
      search: '',
    });
  }

  editPendingItem(i: number) {
    const p = this.pendingItems[i];
    this.productForm.patchValue({
      code: p.code,
      name: p.name,
      description: p.description ?? '',
      minStock: p.minStock,
      quantity: p.quantity,
    });
    this.editingIndex = i;
  }

  removePendingItem(i: number) {
    this.pendingItems.splice(i, 1);
    if (this.editingIndex === i) this.editingIndex = null;
  }

  // ──────────────────────────────────────────────────────────
  // Guardar productos del formulario al estante
  // ──────────────────────────────────────────────────────────
  async savePendingToShelf() {
    if (!this.shelf) return this.openToast('Escanea un estante primero.');
    if (!this.pendingItems.length) return this.openToast('No hay productos.');

    try {
      for (const p of this.pendingItems) {
        const productId = await this.db.upsertProductByCode(
          p.code,
          p.name,
          p.description ?? null,
          p.minStock
        );

        await this.db.addOrUpdateLocation(
          productId,
          this.shelf.id,
          p.quantity
        );
      }

      this.pendingItems = [];
      this.editingIndex = null;

      await this.refreshShelfProducts();

      try {
        await this.sync.syncAll();
        this.openToast('Productos agregados y sincronizados.');
      } catch {
        this.openToast('Agregado localmente. Falló sincronización.');
      }
    } catch (e) {
      console.error(e);
      this.openToast('Error al guardar productos.');
    }
  }
}
