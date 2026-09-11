"use client";

import type { ReactNode } from "react";

export type ListFilterOption<Value extends string> = { value: Value; label: string; count?: number };

type PaginatedListProps<Filter extends string, Sort extends string, Secondary extends string = Filter> = {
  totalCount: number;
  page: number;
  totalPages: number;
  itemLabel?: string;
  filterOptions?: readonly ListFilterOption<Filter>[];
  activeFilter?: Filter;
  onFilterChange?: (value: Filter) => void;
  secondaryFilterOptions?: readonly ListFilterOption<Secondary>[];
  activeSecondaryFilter?: Secondary;
  onSecondaryFilterChange?: (value: Secondary) => void;
  secondaryFilterLabel?: string;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  searchLabel?: string;
  searchPlaceholder?: string;
  sortOptions?: readonly ListFilterOption<Sort>[];
  activeSort?: Sort;
  onSortChange?: (value: Sort) => void;
  onPageChange: (page: number) => void;
  emptyState?: ReactNode;
};

export function PaginatedListControls<Filter extends string, Sort extends string, Secondary extends string = Filter>({
  totalCount,
  page,
  totalPages,
  itemLabel = "elementos",
  filterOptions = [],
  activeFilter,
  onFilterChange,
  secondaryFilterOptions = [],
  activeSecondaryFilter,
  onSecondaryFilterChange,
  secondaryFilterLabel = "Filtrar por área",
  searchQuery,
  onSearchChange,
  searchLabel = "Buscar",
  searchPlaceholder = "Buscar en los resultados",
  sortOptions = [],
  activeSort,
  onSortChange,
  onPageChange,
  emptyState,
}: PaginatedListProps<Filter, Sort, Secondary>) {
  const hasFilters = filterOptions.length > 0 && activeFilter !== undefined && onFilterChange;
  const hasSecondaryFilters = secondaryFilterOptions.length > 0 && activeSecondaryFilter !== undefined && onSecondaryFilterChange;
  const hasSort = sortOptions.length > 0 && activeSort !== undefined && onSortChange;
  const safePage = Math.min(Math.max(page, 1), Math.max(totalPages, 1));

  return (
    <div className="paginated-list-controls" data-total-count={totalCount} data-page={safePage} data-total-pages={totalPages}>
      {searchQuery !== undefined && onSearchChange ? <div className="paginated-list-controls__search-row">
        <label><span>{searchLabel}</span><input type="search" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} /></label>
        {searchQuery ? <button className="paginated-list-controls__clear-search" type="button" onClick={() => onSearchChange("")}>Limpiar búsqueda</button> : null}
      </div> : null}
      <div className="paginated-list-controls__filters">
        {hasFilters ? <div className="paginated-list-controls__filter-group" role="group" aria-label={`Filtrar ${itemLabel}`}>
          {filterOptions.map((option) => <button key={option.value} type="button" aria-pressed={activeFilter === option.value} onClick={() => onFilterChange?.(option.value)}>{option.label}{option.count === undefined ? null : <small>{option.count}</small>}</button>)}
        </div> : null}
        {hasSecondaryFilters ? <div className="paginated-list-controls__secondary-filter">
          <label htmlFor="paginated-list-secondary-filter">{secondaryFilterLabel}</label>
          <select id="paginated-list-secondary-filter" value={activeSecondaryFilter} onChange={(event) => onSecondaryFilterChange?.(event.target.value as Secondary)}>{secondaryFilterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}{option.count === undefined ? "" : ` (${option.count})`}</option>)}</select>
        </div> : null}
        {hasSort ? <label className="paginated-list-controls__sort">Ordenar
          <select value={activeSort} onChange={(event) => onSortChange?.(event.target.value as Sort)}>{sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        </label> : null}
      </div>
      {totalCount === 0 && emptyState ? <div className="paginated-list-controls__empty">{emptyState}</div> : null}
      <div className="paginated-list-controls__footer">
        <span>{totalCount} {itemLabel}</span>
        {totalPages > 1 ? <nav aria-label={`Paginación de ${itemLabel}`} className="paginated-list-controls__pagination">
          <button type="button" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)}>Anterior</button>
          <span aria-current="page">Página {safePage} de {totalPages}</span>
          <button type="button" disabled={safePage >= totalPages} onClick={() => onPageChange(safePage + 1)}>Siguiente</button>
        </nav> : <span className="paginated-list-controls__page-status">Página 1 de 1</span>}
      </div>
    </div>
  );
}