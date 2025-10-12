// src/app/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private _client: SupabaseClient;
  private _session$ = new BehaviorSubject<Session | null>(null);
  session$ = this._session$.asObservable();

  constructor() {
    this._client = createClient(environment.SUPABASE_URL, environment.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,   // guarda la sesión (localStorage / WebView)
        autoRefreshToken: true
      }
    });

    // Cargar sesión al inicio
    this._client.auth.getSession().then(({ data }) => this._session$.next(data.session));

    // Escuchar cambios de auth (login/logout/refresh)
    this._client.auth.onAuthStateChange((_event, session) => this._session$.next(session));
  }

  // ======= AUTH =======
  signUp(email: string, password: string) {
    return this._client.auth.signUp({ email, password });
  }

  signIn(email: string, password: string) {
    return this._client.auth.signInWithPassword({ email, password });
  }

  resetPassword(email: string) {
    return this._client.auth.resetPasswordForEmail(email);
  }

  signOut() {
    return this._client.auth.signOut();
  }

  // Helpers
  get client() { return this._client; }

  async getAccessToken(): Promise<string | null> {
    const { data } = await this._client.auth.getSession();
    return data.session?.access_token ?? null;
    }
}
