// src/app/services/sync.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { LocalDbService } from '../db-local/db-local';

const SUPABASE_URL = 'https://ljtfuqtrsednjalrcihp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqdGZ1cXRyc2VkbmphbHJjaWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU1NjMzMjgsImV4cCI6MjA0MTEzOTMyOH0.tDvntBLjzoRP77-HVCltjb-27N365uu7x3Tx7qZ6X5Q';

const H = new HttpHeaders({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  Prefer: 'return=representation,resolution=merge-duplicates',
  'Content-Type': 'application/json'
});

type TableName = 'warehouses' | 'shelves' | 'products' | 'product_locations';

@Injectable({ providedIn: 'root' })
export class SyncService {
  constructor(private http: HttpClient, private db: LocalDbService) {}

  async syncAll() {
    // PUSH (orden: maestras → dependientes)
    await this.pushTable('warehouses');
    await this.pushTable('shelves');
    await this.pushTable('products');
    await this.pushTable('product_locations');

    // PULL
    await this.pullTable('warehouses');
    await this.pullTable('shelves');
    await this.pullTable('products');
    await this.pullTable('product_locations');

    await this.db.run(
      `update meta_sync set value=? where key='last_pull'`,
      [new Date().toISOString()]
    );
  }

  private async pushTable(table: TableName) {
    const rows = await this.db.query<any>(`select * from ${table} where pending_sync=1`);
    if (!rows.length) return;

    const url = `${SUPABASE_URL}/rest/v1/inventory.${table}`;
    // normaliza boolean/integer → boolean en remoto
    const body = rows.map(r => ({
      ...r,
      deleted: !!r.deleted,
      // deja comments/address/area/qr_text tal cual (pueden ser null)
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
    await this.http.post(url, body, { headers: H }).toPromise();

    const ids = rows.map(r => r.id);
    const placeholders = ids.map(() => '?').join(',');
    await this.db.run(`update ${table} set pending_sync=0 where id in (${placeholders})`, ids);
  }

  private async pullTable(table: TableName) {
    const lastPull = (await this.db.query<{ value: string }>(
      `select value from meta_sync where key='last_pull'`
    ))[0]?.value || '1970-01-01T00:00:00.000Z';

    const url = `${SUPABASE_URL}/rest/v1/inventory.${table}`;
    const params = new HttpParams()
      .set('select', '*')
      .set('updated_at', `gt.${lastPull}`)
      .set('order', 'updated_at.asc')
      .set('limit', 1000);

    const serverRows = (await this.http.get<any[]>(url, { headers: H, params }).toPromise()) ?? [];

    for (const r of serverRows) {
      const exists = await this.db.query<{ id: string }>(
        `select id from ${table} where id=?`, [r.id]
      );

      if (exists.length) {
        await this.db.run(
          `update ${table}
             set code = coalesce(? , code),
                 name = coalesce(? , name),
                 address = coalesce(? , address),
                 warehouse_id = coalesce(? , warehouse_id),
                 area = coalesce(? , area),
                 qr_text = coalesce(? , qr_text),
                 description = coalesce(? , description),
                 min_stock = coalesce(? , min_stock),
                 product_id = coalesce(? , product_id),
                 shelf_id   = coalesce(? , shelf_id),
                 quantity   = coalesce(? , quantity),
                 comments   = ?,
                 deleted    = ?,
                 created_by = ?,
                 created_at = ?,
                 updated_at = ?,
                 pending_sync = 0
           where id = ?`,
          [
            r.code ?? null, r.name ?? null, r.address ?? null,
            r.warehouse_id ?? null, r.area ?? null, r.qr_text ?? null,
            r.description ?? null, r.min_stock ?? null, r.product_id ?? null,
            r.shelf_id ?? null, r.quantity ?? null,
            r.comments ?? null,
            r.deleted ? 1 : 0, r.created_by ?? null, r.created_at, r.updated_at, r.id
          ]
        );
      } else {
        await this.db.run(
          `insert into ${table}
            (id, code, name, address, warehouse_id, area, qr_text, description, min_stock,
             product_id, shelf_id, quantity, comments, deleted, created_by, created_at, updated_at, pending_sync)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            r.id, r.code ?? null, r.name ?? null, r.address ?? null,
            r.warehouse_id ?? null, r.area ?? null, r.qr_text ?? null, r.description ?? null,
            r.min_stock ?? null, r.product_id ?? null, r.shelf_id ?? null, r.quantity ?? null,
            r.comments ?? null,
            r.deleted ? 1 : 0, r.created_by ?? null, r.created_at, r.updated_at
          ]
        );
      }
    }
  }
}
