import React, { useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

export type FilterName = 'prices' | 'industries' | 'catalogSizes' | 'features';
export type FilterSelection = Record<FilterName, string[]>;
export type Facets = Pick<FilterSelection, 'industries' | 'catalogSizes' | 'features'>;

const groups: { key: FilterName; label: string }[] = [
  {key:'prices',label:'Price'},
  {key:'industries',label:'Industry'},
  {key:'catalogSizes',label:'Catalog size'},
  {key:'features',label:'Features'},
];
export function CatalogFilters({ facets, selection, onToggle, onClear, labels }: {
  facets: Facets;
  selection: FilterSelection;
  onToggle: (name: FilterName, value: string) => void;
  onClear: () => void;
  labels?: Partial<Record<FilterName,string>>;
}) {
  const choices: FilterSelection = {prices:['Free','Paid','Not listed'], ...facets};
  const count = Object.values(selection).reduce((sum,values)=>sum+values.length,0);
  const [expanded,setExpanded] = useState(false);
  return <aside className="catalog-sidebar" aria-label="Theme filters">
    <div className="catalog-filter-wrapper">
      <button type="button" className="filter-drawer-heading" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}><SlidersHorizontal size={16}/> Filters {count ? '('+count+')' : ''} <ChevronDown size={16}/></button>
      <div className={'filter-groups '+(expanded?'expanded':'')}>
        {count>0&&<button type="button" className="clear-all-filters" onClick={onClear}>Clear all filters</button>}
        {groups.map(group=><details className="filter-group" key={group.key} open>
          <summary>{labels?.[group.key] || group.label}<ChevronDown size={15}/></summary>
          <div className="filter-options">
            {choices[group.key].map(option=><label className="filter-option" key={option}>
              <input type="checkbox" checked={selection[group.key].includes(option)} onChange={()=>onToggle(group.key,option)}/>
              <span>{option}</span>
            </label>)}
            {!choices[group.key].length&&<span className="filter-unavailable">No matching theme attributes</span>}
          </div>
        </details>)}
      </div>
    </div>
  </aside>;
}
