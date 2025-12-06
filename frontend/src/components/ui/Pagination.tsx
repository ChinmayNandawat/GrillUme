import { Button } from "./Button";
import { useMemo } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const paginationRange = useMemo(() => {
    const range = [];
    const delta = 1; // Number of pages to show around current page
    
    // Always include first page
    range.push(1);
    
    if (currentPage > delta + 2) {
      range.push("...");
    }
    
    // Pages around current page
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    
    if (currentPage < totalPages - delta - 1) {
      range.push("...");
    }
    
    // Always include last page if it's not the first page
    if (totalPages > 1) {
      range.push(totalPages);
    }
    
    return range;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="mt-16 flex flex-wrap justify-center items-center gap-4">
      <Button 
        variant="outline" 
        className="px-6 py-3 italic"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        ariaLabel="Previous page"
      >
        &lt; PREV
      </Button>
      
      <div className="flex gap-2 items-center">
        {paginationRange.map((page, index) => {
          if (page === "...") {
            return (
              <span key={`dots-${index}`} className="w-8 text-center font-headline font-black text-xl opacity-40">
                ...
              </span>
            );
          }
          
          const isCurrent = page === currentPage;
          return (
            <button 
              key={`page-${page}`}
              onClick={() => onPageChange(page as number)}
              aria-label={`Go to page ${page}`}
              aria-current={isCurrent ? "page" : undefined}
              className={`w-12 h-12 comic-border kinetic-shadow font-headline font-black text-xl flex items-center justify-center transition-colors ${
                isCurrent 
                  ? "bg-primary-container -rotate-3" 
                  : "bg-white rotate-3 hover:bg-surface-container-high"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <Button 
        variant="primary" 
        className="px-6 py-3 italic rotate-2"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        ariaLabel="Next page"
      >
        NEXT &gt;
      </Button>
    </div>
  );
};
