export type UiThemePackagePath = {slug:string;digest:string;file:string};
export type UiThemeRecord = {
  id:string; slug:string; account_id:string|null; visibility:string;
  status:string; css_r2_bucket:string|null;css_r2_key:string|null;compiled_css_hash:string|null;
};
export function parseUiThemePackagePath(pathname:string): UiThemePackagePath|null;
export function authorizeStudioTheme(request:Request,row:UiThemeRecord):Promise<boolean>;
export function serveUiThemePackage(
  request:Request,
  env:{DB?:D1Database;THEME_PACKAGES:R2Bucket},
  authenticate?:(request:Request,row:UiThemeRecord)=>Promise<boolean>,
):Promise<Response>;
