/**
 * Theme Store is a CMS site, not a manually republished R2 mock site.
 * Read the account-owned, published D1 rows that AgentSam CMS authoring writes.
 * Historical R2 snapshots remain a delivery fallback only.
 */
const SITE = 'theme-store';
const DOMAIN = 'themes.inneranimalmedia.com';

function recordObject(raw) {
  if (typeof raw !== 'string' || raw.length > 262144) throw Error('cms_payload_invalid');
  const obj = JSON.parse(raw);
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw Error('cms_payload_invalid');
  return obj;
}

export async function publishedStoreSettings(db) {
  if (!db) return null;
  const site = await db.prepare(
    "SELECT id,account_id,settings_json FROM cms_sites WHERE id=? AND slug=? AND primary_domain=? AND status='active' LIMIT 1"
  ).bind(SITE, SITE, DOMAIN).first();
  if (!site?.account_id) throw Error('cms_theme_store_site_not_active');
  const settings = recordObject(site.settings_json);
  if (!settings.store || settings.store.schema !== 'iam.theme-store-site.v1') throw Error('cms_theme_store_settings_invalid');
  return settings.store;
}

export async function publishedStoreGlobal(db, globalKey) {
  if (!db) return null;
  if (!['header','footer'].includes(globalKey)) throw Error('cms_global_key_invalid');
  // Validate owner, status and source before exposing publication data.
  const row = await db.prepare(
    `SELECT g.inline_content_json,g.content_version,g.content_hash
     FROM cms_globals g JOIN cms_sites s ON s.id=g.site_id AND s.account_id=g.account_id
     WHERE g.site_id=? AND s.slug=? AND s.primary_domain=? AND s.status='active'
       AND g.global_key=? AND g.global_type=? AND g.status='published' LIMIT 1`
  ).bind(SITE, SITE, DOMAIN, globalKey, globalKey).first();
  if (!row) throw Error('cms_published_global_missing');
  if (!Number.isInteger(row.content_version) || row.content_version < 1 ||
      !/^[0-9a-f]{64}$/.test(row.content_hash || '')) throw Error('cms_published_global_invalid');
  const content = recordObject(row.inline_content_json);
  if (content.schema !== 'iam.cms.global-' + globalKey + '.v1') throw Error('cms_published_global_schema_mismatch');
  return content;
}
