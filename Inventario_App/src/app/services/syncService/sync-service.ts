// src/app/services/sync.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { LocalDbService } from '../db-local/db-local';
import { environment } from 'src/environments/environment';


const SUPABASE_URL = environment.SUPABASE_URL;
const SUPABASE_KEY = environment.SUPABASE_ANON_KEY;

const H = new HttpHeaders({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  Prefer: 'return=representation',
  'Content-Type': 'application/json',
});

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly baseUrl = `${SUPABASE_URL}/rest/v1`;

  constructor(
    private http: HttpClient,
    private db: LocalDbService
  ) {}

  /**
   * Sincroniza SOLO product_locations (ubicaciones).
   * Se puede llamar después de agregar productos a un estante.
   */
  async syncAll(): Promise<void> {
    try {
      await this.pushLocations();
      await this.pullLocations();

      await this.db.run(
        `UPDATE meta_sync SET value=? WHERE key='last_pull'`,
        [new Date().toISOString()]
      );
    } catch (err) {
      console.error('Error en syncAll:', err);
      throw err;
    }
  }

  // ========== PUSH: locales → Supabase ==========
  private async pushLocations(): Promise<void> {
    const rows = await this.db.query<any>(
      `SELECT id, product_id, shelf_id, quantity, comments, deleted,
              created_by, created_at, updated_at
         FROM product_locations
        WHERE pending_sync = 1`
    );

    if (!rows.length) return;

    for (const r of rows) {
      const payload = {
        id: r.id,
        product_id: r.product_id,
        shelf_id: r.shelf_id,
        quantity: r.quantity ?? 0,
        comments: r.comments ?? null,
        deleted: !!r.deleted,
        created_by: r.created_by ?? null,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };

      try {
        // 1) Intentar actualizar (PATCH) por id
        await this.http
          .patch(
            `${this.baseUrl}/product_locations?id=eq.${encodeURIComponent(r.id)}`,
            payload,
            { headers: H }
          )
          .toPromise();
      } catch (err: any) {
        // Si no existe (404) → crearlo con POST
        if (err?.status === 404) {
          await this.http
            .post(`${this.baseUrl}/product_locations`, [payload], { headers: H })
            .toPromise();
        } else {
          console.error('Error en pushLocations para id', r.id, err);
          throw err;
        }
      }

      // Si llegó aquí, la fila se sincronizó
      await this.db.run(
        `UPDATE product_locations SET pending_sync = 0 WHERE id = ?`,
        [r.id]
      );
    }
  }

  // ========== PULL: Supabase → local ==========
  private async pullLocations(): Promise<void> {
    const lastPullRow = await this.db.query<{ value: string }>(
      `SELECT value FROM meta_sync WHERE key='last_pull'`
    );
    const lastPull =
      lastPullRow[0]?.value || '1970-01-01T00:00:00.000Z';

    const params = new HttpParams()
      .set('select', '*')
      .set('updated_at', `gt.${lastPull}`)
      .set('order', 'updated_at.asc')
      .set('limit', 1000);

    const url = `${this.baseUrl}/product_locations`;
    const serverRows =
      (await this.http
        .get<any[]>(url, { headers: H, params })
        .toPromise()) ?? [];

    for (const r of serverRows) {
      const exists = await this.db.query<{ id: string }>(
        `SELECT id FROM product_locations WHERE id = ?`,
        [r.id]
      );

      if (exists.length) {
        await this.db.run(
          `UPDATE product_locations
              SET product_id = ?,
                  shelf_id   = ?,
                  quantity   = ?,
                  comments   = ?,
                  deleted    = ?,
                  created_by = ?,
                  created_at = ?,
                  updated_at = ?,
                  pending_sync = 0
            WHERE id = ?`,
          [
            r.product_id,
            r.shelf_id,
            r.quantity ?? 0,
            r.comments ?? null,
            r.deleted ? 1 : 0,
            r.created_by ?? null,
            r.created_at,
            r.updated_at,
            r.id,
          ]
        );
      } else {
        await this.db.run(
          `INSERT INTO product_locations
             (id, product_id, shelf_id, quantity, comments, deleted,
              created_by, created_at, updated_at, pending_sync)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            r.id,
            r.product_id,
            r.shelf_id,
            r.quantity ?? 0,
            r.comments ?? null,
            r.deleted ? 1 : 0,
            r.created_by ?? null,
            r.created_at,
            r.updated_at,
          ]
        );
      }
    }
  }
}
