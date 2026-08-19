import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TiketPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export function TiketPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
}: TiketPaginationProps) {
  // Logic to generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage < 5) {
        pages.push(1, 2, 3, 4, 5, 6, '...', totalPages);
      } else if (currentPage > totalPages - 4) {
        pages.push(1, '...', totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || 0);

  return (
    <div className="flex items-center justify-between w-full">
        {/* Left Side: Showing text */}
        {totalItems !== undefined ? (
             <span className="text-[14px] text-[#71747d] font-medium" style={{ fontFamily: "'Tiket Odyssey Text', sans-serif" }}>
                 Showing {startItem}-{endItem} of {totalItems}
             </span>
        ) : (
            <div /> // Spacer
        )}

        {/* Right Side: Pagination Controls */}
        <div className="flex items-center gap-[4px]">
            {/* Previous Button */}
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-[24px] w-[26px] flex items-center justify-center disabled:cursor-not-allowed group transition-colors hover:bg-[#f4f7fe] rounded-[4px] disabled:hover:bg-transparent"
            >
               <ChevronLeft 
                 className={`w-5 h-5 transition-colors ${currentPage === 1 ? 'text-[#D8DCE8]' : 'text-[#4D4F56] group-hover:text-[#007BFF]'}`} 
               />
            </button>
    
            {pages.map((page, index) => {
              if (page === '...') {
                 return (
                    <div key={`ellipsis-${index}`} className="h-[24px] w-[26px] flex items-center justify-center">
                        <p className="font-bold text-[#71747d] text-[14px]" style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 700 }}>...</p>
                    </div>
                 )
              }
              
              const isActive = page === currentPage;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page as number)}
                  className={`h-[24px] w-[26px] flex items-center justify-center rounded-[100px] transition-colors ${isActive ? 'bg-[#e7f2ff]' : 'hover:bg-[#f4f7fe]'}`}
                >
                  <p className={`font-bold text-[14px] leading-[20px] ${isActive ? 'text-[#007bff]' : 'text-[#71747d]'}`} style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 700 }}>
                    {page}
                  </p>
                </button>
              );
            })}
    
            {/* Next Button */}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-[24px] w-[26px] flex items-center justify-center disabled:cursor-not-allowed group transition-colors hover:bg-[#f4f7fe] rounded-[4px] disabled:hover:bg-transparent"
            >
               <ChevronRight 
                 className={`w-5 h-5 transition-colors ${currentPage === totalPages ? 'text-[#D8DCE8]' : 'text-[#4D4F56] group-hover:text-[#007BFF]'}`} 
               />
            </button>
        </div>
    </div>
  );
}
