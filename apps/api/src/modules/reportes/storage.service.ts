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
      // DEBUG TEMPORAL: diagnosticar por qué Railway no está exponiendo estas
      // env vars al proceso, sin filtrar el valor real. Revertir apenas se
      // identifique la causa.
      throw new InternalServerErrorException(
        `Storage no configurado (debug): url_presente=${!!url} url_len=${url?.length ?? 0} key_presente=${!!key} key_len=${key?.length ?? 0} bucket=${this.config.supabaseReportesBucket}`,
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
