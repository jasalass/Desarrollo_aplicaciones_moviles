// src/app/agregar-producto/agregar-producto.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonButton, IonToast, IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { LocalDbService } from '../services/db-local/db-local';
import { ScannerService } from '../services/scannerService/scanner-service';

type Shelf = { id: string; code: string; name: string; qr_text?: string };

@Component({
  selector: 'app-agregar-producto',
  standalone: true,
  templateUrl: './agregar-producto.page.html',
  styleUrls: ['./agregar-producto.page.scss'],
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonButton, IonToast, IonCard, IonCardHeader, IonCardTitle, IonCardContent
  ]
})
export class AgregarProductoPage {
  form: FormGroup;
  shelves: Shelf[] = [];
  isToastOpen = false;
  toastMsg = '';
  toastDur = 2000;

  constructor(
    private fb: FormBuilder,
    private db: LocalDbService,
    private scan: ScannerService,
    private loadingCtrl: LoadingController,
    private router: Router
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(32)]],
      name: ['', [Validators.required, Validators.maxLength(80)]],
      description: [''],
      min_stock: [0, [Validators.min(0)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      shelf_id: ['', [Validators.required]],
    });
    this.loadShelves();
  }

  private async loadShelves() {
    this.shelves = await this.db.getShelves();
  }

  toast(msg: string, dur = 2000) {
    this.toastMsg = msg;
    this.toastDur = dur;
    this.isToastOpen = true;
  }

  async scanShelf() {
    try {
      const qr = await this.scan.scanOnce();
      if (!qr) { this.toast('No se leyó QR'); return; }
      const shelf = await this.db.findShelfByQr(qr);
      if (shelf) {
        this.form.patchValue({ shelf_id: shelf.id });
        this.toast(`Estante: ${shelf.code} - ${shelf.name}`, 1500);
      } else {
        this.toast(`QR no coincide con un estante`, 2000);
      }
    } catch (e: any) {
      this.toast(e?.message ?? 'Error escaneando');
    }
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { code, name, description, min_stock, quantity, shelf_id } = this.form.getRawValue();

    const loading = await this.loadingCtrl.create({ message: 'Guardando...', spinner: 'lines' });
    await loading.present();
    try {
      // 1) producto (upsert por code)
      const productId = await this.db.upsertProductByCode(code.trim(), name.trim(), description?.trim() || null, Number(min_stock) || 0);

      // 2) ubicación (suma si existe)
      await this.db.addOrUpdateLocation(productId, shelf_id, Number(quantity));

      this.toast('Producto guardado en estante');
      this.form.reset({ min_stock: 0, quantity: 1, shelf_id }); // deja estante seleccionado para rapidez
    } catch (e: any) {
      this.toast(e?.message ?? 'Error al guardar');
    } finally {
      await loading.dismiss();
    }
  }

  irHome() { this.router.navigateByUrl('/home'); }
}
