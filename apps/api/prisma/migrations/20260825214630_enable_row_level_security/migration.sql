-- Supabase security advisor: todas las tablas de public quedaban expuestas
-- vía la API REST autogenerada de PostgREST (accesible con la anon key) al
-- no tener Row-Level Security habilitado. El backend de esta app usa Prisma
-- con el rol "postgres" (rolbypassrls=true), así que activar RLS sin agregar
-- políticas no afecta el acceso de la aplicación — solo cierra el acceso vía
-- esa API REST que no se usa.
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."animal_bajas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."animal_movimientos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."animales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."aplicaciones_sanitarias" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."celos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cuarentenas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cuentas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."destetes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."diagnosticos_gestacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."diagnosticos_sanitarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."insumos_alimentacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."intentos_login" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."invitaciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."negocios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."partos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."plan_alimentacion_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."plan_asignaciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."planes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."planes_alimentacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."potreros" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."productos_sanitarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."protocolos_sanitarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."refresh_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."registros_leche" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."registros_leche_total" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."registros_peso" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reportes_generados" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."servicios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."suministros" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."suministros_recurrentes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tokens_recuperacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tokens_verificacion_email" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."usuario_negocio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."usuarios" ENABLE ROW LEVEL SECURITY;
