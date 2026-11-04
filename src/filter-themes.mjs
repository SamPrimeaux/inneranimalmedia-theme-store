/** Facets are derived from the package catalog, never from a parallel theme registry. */
export function availableFilters(themes) {
  const unique = values => [...new Set(values)].sort((a,b) => a.localeCompare(b));
  return {
    industries: unique(themes.flatMap(t => t.industries || [t.category])),
    catalogSizes: unique(themes.flatMap(t => t.catalogSizes || [])),
    features: unique(themes.flatMap(t => t.features || t.pages)),
  };
}
function matchesSelected(selected, actual) {
  return !selected?.length || selected.some(value => actual.includes(value));
}
export function filterThemes(themes, filters = {}) {
  const search = (filters.query || '').trim().toLowerCase();
  const result = themes.filter(theme => {
    if (search && ![theme.name, theme.summary, theme.publisher, theme.category,
      ...theme.tags, ...theme.pages].join(' ').toLowerCase().includes(search)) return false;
    const price = theme.priceUsd === 0 ? 'Free' :
      typeof theme.priceUsd === 'number' && theme.priceUsd > 0 ? 'Paid' : 'Not listed';
    return matchesSelected(filters.prices, [price])
      && matchesSelected(filters.industries, theme.industries || [theme.category])
      && matchesSelected(filters.catalogSizes, theme.catalogSizes || [])
      && matchesSelected(filters.features, theme.features || theme.pages);
  });
  switch (filters.sort) {
    case 'name': return result.sort((a,b) => a.name.localeCompare(b.name));
    case 'price-ascending': return result.sort((a,b) => (a.priceUsd ?? Infinity) - (b.priceUsd ?? Infinity) || a.name.localeCompare(b.name));
    default: return result;
  }
}
