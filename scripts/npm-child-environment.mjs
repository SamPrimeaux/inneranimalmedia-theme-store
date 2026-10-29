/**
 * npm 10 passes inherited npm_config_allow_scripts when running npm scripts.
 * npm 11 treats that inherited env value as an impermissible per-command
 * override during a project-scoped npm ci (EALLOWSCRIPTS).
 *
 * Remove only that inherited override from nested npm invocations.
 * The target project's package.json and project/user .npmrc policy continue
 * to apply normally: we do not bypass install script security.
 */
export function npmChildEnvironment(parent = process.env) {
  const child = { ...parent };
  for (const name of Object.keys(child)) {
    if (/^npm_config_allow[-_]scripts$/i.test(name)) {
      delete child[name];
    }
  }
  return child;
}
