import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  startIndex: number
  endIndex: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className = '',
}) => {
  if (totalItems === 0) return null

  return (
    <div className={`table-pagination-container ${className}`}>
      <div className="pagination-info">
        Exibindo <span className="fw-semibold">{totalItems > 0 ? startIndex + 1 : 0}</span> a{' '}
        <span className="fw-semibold">{endIndex}</span> de{' '}
        <span className="fw-semibold">{totalItems}</span> itens
      </div>

      <div className="pagination-controls">
        {onPageSizeChange && (
          <div className="page-size-selector">
            <span className="text-muted small me-2">Itens por página:</span>
            <select
              className="form-select form-select-sm page-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Itens por página"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="page-buttons-group">
          <button
            type="button"
            className="btn-pagination-nav"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            title="Primeira página"
          >
            <ChevronsLeft className="icon-sm" />
          </button>
          
          <button
            type="button"
            className="btn-pagination-nav"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            title="Página anterior"
          >
            <ChevronLeft className="icon-sm" />
          </button>

          <span className="pagination-current-label">
            Página <span className="fw-semibold">{currentPage}</span> de{' '}
            <span className="fw-semibold">{totalPages}</span>
          </span>

          <button
            type="button"
            className="btn-pagination-nav"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            title="Próxima página"
          >
            <ChevronRight className="icon-sm" />
          </button>

          <button
            type="button"
            className="btn-pagination-nav"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            title="Última página"
          >
            <ChevronsRight className="icon-sm" />
          </button>
        </div>
      </div>
    </div>
  )
}
