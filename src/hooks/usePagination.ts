import { useState, useMemo } from 'react'

export interface UsePaginationOptions<T> {
  data: T[]
  initialPageSize?: number
  initialPage?: number
}

export interface UsePaginationResult<T> {
  currentPage: number
  pageSize: number
  totalPages: number
  totalItems: number
  startIndex: number
  endIndex: number
  paginatedData: T[]
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  nextPage: () => void
  prevPage: () => void
  canNext: boolean
  canPrev: boolean
}

export function usePagination<T>({
  data,
  initialPageSize = 10,
  initialPage = 1,
}: UsePaginationOptions<T>): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const [pageSize, setPageSize] = useState<number>(initialPageSize)

  const totalItems = data.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  // Ensure current page is within valid range if data size changes
  const validPage = Math.min(Math.max(1, currentPage), totalPages)

  const startIndex = (validPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex)
  }, [data, startIndex, endIndex])

  const setPage = (page: number) => {
    const p = Math.min(Math.max(1, page), totalPages)
    setCurrentPage(p)
  }

  const handleSetPageSize = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const nextPage = () => {
    if (validPage < totalPages) {
      setCurrentPage((p) => p + 1)
    }
  }

  const prevPage = () => {
    if (validPage > 1) {
      setCurrentPage((p) => p - 1)
    }
  }

  return {
    currentPage: validPage,
    pageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    paginatedData,
    setPage,
    setPageSize: handleSetPageSize,
    nextPage,
    prevPage,
    canNext: validPage < totalPages,
    canPrev: validPage > 1,
  }
}
