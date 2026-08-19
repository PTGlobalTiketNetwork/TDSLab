import React from 'react';
import svgPaths from '../../../imports/svg-5ettuqfcar';

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: CustomPaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

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

  if (totalItems === 0) return null;

  return (
    <div className="flex h-[32px] items-center justify-between w-full mt-6">
      <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[16px] not-italic text-[#71747d] text-[12px] whitespace-nowrap">
        Showing {startItem}-{endItem} of {totalItems}
      </p>
      
      <div className="flex gap-[4px] items-start">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-[24px] w-[26px] flex items-center justify-center disabled:cursor-not-allowed group"
        >
           <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
             <path 
                d={svgPaths.p64152c0} 
                fill={currentPage === 1 ? "#D8DCE8" : "#4D4F56"} 
                className="transition-colors group-hover:fill-[#007BFF] group-disabled:group-hover:fill-[#D8DCE8]"
             />
           </svg>
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
              className={`h-[24px] w-[26px] relative flex items-center justify-center rounded-[100px] transition-colors ${isActive ? 'bg-[#e7f2ff]' : 'hover:bg-[#f4f7fe]'}`}
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
          className="h-[24px] w-[26px] flex items-center justify-center disabled:cursor-not-allowed group"
        >
           <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
             <path 
                d={svgPaths.p37aaca80} 
                fill={currentPage === totalPages ? "#D8DCE8" : "#4D4F56"} 
                className="transition-colors group-hover:fill-[#007BFF] group-disabled:group-hover:fill-[#D8DCE8]"
             />
           </svg>
        </button>
      </div>
    </div>
  );
}