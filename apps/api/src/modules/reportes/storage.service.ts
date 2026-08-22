import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppConfigService } from '../../config/app-config.service';

const TTL_URL_FIRMADA_SEGUNDOS = 60 * 60;

@Injectable()
export class StorageService {
  private client: SupabaseClient | null = null;

  constructor(private readonly config: AppConfigService) {}

  private getClient(): SupabaseClient {
    if (this.client) return this.client;

    const url = this.config.supabaseUrl;
    const key = this.config.supabaseServiceRoleKey;
    if (!url || !key) {
      // DEBUG TEMPORAL v3: diagnosticar por qué Railway no está exponiendo
      // estas env vars al proceso. Lista las claves de process.env que
      // matchean nuestros patrones (sin exponer valores) para confirmar qué
      // ve Node realmente. Revertir apenas se identifique la causa.
      const claves = Object.keys(process.env)
        .filter((k) => k.includes('SUPABASE') || k.includes('SB_STORAGE'))
        .sort();
      throw new InternalServerErrorException(
        `Storage no configurado (debug v3): url=${!!url} key=${!!key} totalEnvKeys=${Object.keys(process.env).length} clavesMatch=[${claves.join(',')}]`,
      );
    }
    this.client = createClient(url, key);
    return this.client;
  }

  async subir(path: string, contenido: Buffer, contentType: string): Promise<void> {
    const { error } = await this.getClient()
      .storage.from(this.config.supabaseReportesBucket)
      .upload(path, contenido, { contentType, upsert: true });
    if (error) {
      throw new InternalServerErrorException(`No se pudo subir el archivo a storage: ${error.message}`);
    }
  }

  async firmarUrl(path: string): Promise<string> {
    const { data, error } = await this.getClient()
      .storage.from(this.config.supabaseReportesBucket)
      .createSignedUrl(path, TTL_URL_FIRMADA_SEGUNDOS);
    if (error || !data) {
      throw new InternalServerErrorException(`No se pudo firmar la URL de descarga: ${error?.message}`);
    }
    return data.signedUrl;
  }
}
