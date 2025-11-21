// src/app/services/supabaseService/supabase.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export interface UserProfileMeta {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      environment.SUPABASE_URL,
      environment.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );
  }

  // ===== Auth

  /**
   * Registro con metadata básica
   */
  signUp(email: string, password: string, firstName?: string, lastName?: string) {
    return this.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName ?? null,
          last_name: lastName ?? null,
        },
      },
    });
  }

  signIn(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }

  signOut() {
    return this.client.auth.signOut();
  }

  get supabase() {
    return this.client;
  }

  // ===== Helpers

  async getSession(): Promise<Session | null> {
    const { data } = await this.client.auth.getSession();
    return data.session ?? null;
  }

  async currentUserEmail(): Promise<string | null> {
    const { data } = await this.client.auth.getUser();
    return data.user?.email ?? null;
  }

  /**
   * Devuelve perfil resumido desde auth.users + metadata
   */
  async getCurrentUserProfile(): Promise<UserProfileMeta | null> {
    const { data } = await this.client.auth.getUser();
    const user: User | null = data.user;

    if (!user) return null;

    const meta = user.user_metadata || {};
    return {
      id: user.id,
      email: user.email ?? '',
      first_name: meta["first_name"] ?? null,
      last_name: meta["last_name"] ?? null,
    };
  }

  /**
   * Actualiza solo metadata de nombre/apellido
   */
  async updateProfileName(firstName: string, lastName: string) {
    const { error } = await this.client.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    });
    if (error) throw error;
  }

  get sdk() { return this.client; }
}
