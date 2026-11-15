/**
 * Derive the existing AgentSam product/release rows from the PUBLIC Theme Store
 * catalog + its R2-backed, verified install index. No stale staged snapshot.
 * Pure planner: callers verify remote ZIP/project bytes before making a write.
 */
const SLUG = /^[a-z][a-z0-9-]{0,63}$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const HASH = /^[a-f0-9]{64}$/;
const quote = value => "'" + String(value).replaceAll("'", "''") + "'";

export function selectVerifiedThemeReleases(index, catalog, { only } = {}) {
  if (index?.schema !== 'agentsam.website-theme-install-index.v1' ||
    !Array.isArray(index.packages) || catalog?.schema !== 'iam.theme-catalog.v1' ||
    !Array.isArray(catalog.products)) throw Error('invalid_theme_store_catalog_contract');
  if (only && !SLUG.test(only)) throw Error('invalid_theme_slug');
  const products = catalog.products.filter(p => only ? p.slug === only : p.release?.status === 'published');
  if (!products.length) throw Error('theme_release_not_in_catalog:' + (only || '*'));
  const names = new Set();
  return products.map(product => {
    const { slug, version, release } = product;
    if (!SLUG.test(slug || '') || names.has(slug) || !VERSION.test(version || '') ||
      release?.status !== 'published' || !HASH.test(release.sha256 || '') ||
      release.storageKey !== 'releases/' + slug + '/' + version + '/' + release.sha256 + '.zip')
      throw Error('unverified_catalog_release:' + slug);
    names.add(slug);
    const matches = index.packages.filter(p => p.slug === slug &&
      p.version === version && p.sha256 === release.sha256);
    if (matches.length !== 1) throw Error('missing_or_duplicate_verified_install:' + slug);
    const entry = matches[0];
    if (!HASH.test(entry.project_sha256 || '') ||
      entry.project_key !== 'install-projects/' + slug + '/' + version + '/' + entry.project_sha256 + '.json' ||
      entry.project_url !== '/api/themes/' + slug + '/' + version + '/project' ||
      !Number.isSafeInteger(entry.page_count) || entry.page_count < 1 || entry.page_count > 80 ||
      !Number.isSafeInteger(entry.manifest_page_count) || entry.manifest_page_count < 1)
      throw Error('invalid_verified_install_project:' + slug);
    return {
      slug, version, sha256: release.sha256, storageKey: release.storageKey,
      projectHash: entry.project_sha256, projectKey: entry.project_key,
      pageCount: entry.page_count, manifestPageCount: entry.manifest_page_count,
      previewUrl: 'https://themes.inneranimalmedia.com/theme-packages/' + slug + '/' + version + '/preview/',
      sku: 'iam.theme.' + slug,
    };
  });
}

export function planProductReleaseSql(records) {
  if (!Array.isArray(records) || !records.length) throw Error('no_releases_to_register');
  const sql = ['PRAGMA foreign_keys=ON;'];
  for (const record of records) {
    const {slug,version,sha256,storageKey,projectHash,projectKey,pageCount,manifestPageCount,previewUrl,sku,byteSize} = record;
    if (!SLUG.test(slug || '') || !VERSION.test(version || '') ||
      !HASH.test(sha256 || '') || !HASH.test(projectHash || '') ||
      storageKey !== 'releases/' + slug + '/' + version + '/' + sha256 + '.zip' ||
      projectKey !== 'install-projects/' + slug + '/' + version + '/' + projectHash + '.json' ||
      sku !== 'iam.theme.' + slug ||
      !Number.isSafeInteger(pageCount) || pageCount < 1 || pageCount > 80 ||
      !Number.isSafeInteger(manifestPageCount) || manifestPageCount < 1 ||
      !Number.isSafeInteger(byteSize) || byteSize < 1)
      throw Error('invalid_verified_release_record:' + slug);
    const id = 'release_theme_' + slug.replaceAll('-','_') + '_' + version.replaceAll('.','_');
    const pkg = '@inneranimalmedia/theme-' + slug;
    const pMeta = JSON.stringify({themeStore:true,source:'theme-store',category:'website-theme',
      version,releaseSha256:sha256,projectSha256:projectHash,editablePageCount:pageCount,previewUrl});
    const rMeta = JSON.stringify({installer_schema:'agentsam.theme-project.v1',
      project_r2_key:projectKey,project_sha256:projectHash,
      editable_page_count:pageCount,manifest_page_count:manifestPageCount});
    sql.push(`INSERT INTO agentsam_product_releases
      (id, product_id, product_slug, sku, version, channel, release_status, review_status,
       artifact_kind, r2_bucket, r2_key, sha256, byte_size, package_name,
       preview_url, compatible_schema_version, metadata_json, published_at_unix)
      SELECT ${quote(id)}, id, ${quote(slug)}, ${quote(sku)}, ${quote(version)},
       'release','published','approved','theme_zip','theme-store',${quote(storageKey)},
       ${quote(sha256)},${byteSize},${quote(pkg)},${quote(previewUrl)},'2',
       ${quote(rMeta)},unixepoch()
      FROM agentsam_products WHERE slug=${quote(slug)} AND kind='theme'
      ON CONFLICT(id) DO UPDATE SET
        release_status='published',
        review_status='approved',
        byte_size=COALESCE(agentsam_product_releases.byte_size,excluded.byte_size),
        metadata_json=json_patch(COALESCE(agentsam_product_releases.metadata_json,'{}'),excluded.metadata_json),
        published_at_unix=COALESCE(agentsam_product_releases.published_at_unix,excluded.published_at_unix)
      WHERE agentsam_product_releases.sha256=excluded.sha256
        AND agentsam_product_releases.r2_key=excluded.r2_key;`);
    // Only promote the product version when the exact immutable artifact exists.
    sql.push(`UPDATE agentsam_products SET version=${quote(version)},
        source_type='theme-store-package',source_id=${quote(slug)},package_name=${quote(pkg)},
        metadata=json_patch(COALESCE(metadata,'{}'),${quote(pMeta)}),
        status='production',catalog_visibility='public',updated_at=unixepoch()
      WHERE slug=${quote(slug)} AND kind='theme'
        AND EXISTS (SELECT 1 FROM agentsam_product_releases
          WHERE id=${quote(id)} AND product_id=agentsam_products.id
            AND sha256=${quote(sha256)} AND r2_key=${quote(storageKey)}
            AND release_status='published');`);
  }
  return sql.join('\n') + '\n';
}
