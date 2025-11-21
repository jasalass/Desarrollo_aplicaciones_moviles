// src/app/buscar-producto/buscar-producto.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonSpinner,
  IonButton,
} from '@ionic/angular/standalone';

import { LocalDbService } from '../services/db-local/db-local';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  cubeOutline,
  businessOutline,
  cubeSharp,
} from 'ionicons/icons';

type RawRow = {
  product_id: string;
  code: string;
  name: string;
  description?: string | null;
  min_stock: number;
  quantity: number | null;
  shelf_code: string | null;
  shelf_name: string | null;
  warehouse_code: string | null;
  warehouse_name: string | null;
  address: string | null;
};

type LocationInfo = {
  warehouseCode: string;
  warehouseName: string;
  shelfCode: string;
  shelfName: string;
  quantity: number;
  address?: string | null;
};

type ProductResult = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  minStock: number;
  locations: LocationInfo[];
};

@Component({
  selector: 'app-buscar-producto',
  templateUrl: './buscar-producto.page.html',
  styleUrls: ['./buscar-producto.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonText,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonSpinner,
    IonButton,
  ],
})
export class BuscarProductoPage {
  term = '';
  isSearching = false;
  hasSearched = false;

  results: ProductResult[] = [];

  constructor(private db: LocalDbService) {
    addIcons({
      searchOutline,
      cubeOutline,
      businessOutline,
      cubeSharp,
    });
  }

  async onSearch(ev?: any) {
    const value = (ev?.detail?.value ?? this.term ?? '').trim();
    this.term = value;
    this.results = [];
    this.hasSearched = true;

    if (!value || value.length < 2) {
      // no buscamos si es muy corto
      return;
    }

    this.isSearching = true;
    try {
      const sql = `
        SELECT
          p.id         AS product_id,
          p.code       AS code,
          p.name       AS name,
          p.description AS description,
          p.min_stock  AS min_stock,
          pl.quantity  AS quantity,
          s.code       AS shelf_code,
          s.name       AS shelf_name,
          w.code       AS warehouse_code,
          w.name       AS warehouse_name,
          w.address    AS address
        FROM products p
        LEFT JOIN product_locations pl
          ON pl.product_id = p.id
         AND pl.deleted = 0
        LEFT JOIN shelves s
          ON s.id = pl.shelf_id
         AND s.deleted = 0
        LEFT JOIN warehouses w
          ON w.id = s.warehouse_id
         AND w.deleted = 0
        WHERE p.deleted = 0
          AND (p.code LIKE ? OR p.name LIKE ?)
        ORDER BY p.code, w.code, s.code;
      `;

      const rows = await this.db.query<RawRow>(sql, [`%${value}%`, `%${value}%`]);

      // Agrupar por producto
      const map = new Map<string, ProductResult>();

      for (const r of rows) {
        if (!map.has(r.product_id)) {
          map.set(r.product_id, {
            id: r.product_id,
            code: r.code,
            name: r.name,
            description: r.description ?? null,
            minStock: r.min_stock ?? 0,
            locations: [],
          });
        }

        // Si tiene ubicación asociada, la agregamos
        if (r.shelf_code && r.warehouse_code) {
          const prod = map.get(r.product_id)!;
          prod.locations.push({
            warehouseCode: r.warehouse_code,
            warehouseName: r.warehouse_name ?? '',
            shelfCode: r.shelf_code,
            shelfName: r.shelf_name ?? '',
            quantity: r.quantity ?? 0,
            address: r.address,
          });
        }
      }

      this.results = Array.from(map.values());
    } catch (e) {
      console.error('Error buscando producto:', e);
    } finally {
      this.isSearching = false;
    }
  }
}
