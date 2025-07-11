import { h } from "preact";

interface PaginationProps {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export default function Pagination({ page, totalPages, setPage }: PaginationProps) {
  return (
    <div class="logs-pagination-container">
      <button
        class={`logs-pagination-btn${page === 1 ? ' disabled' : ''}`}
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
      >
        Previous
      </button>
      <span class="logs-pagination-info">
        Page {page} / {totalPages}
      </span>
      <button
        class={`logs-pagination-btn${page === totalPages ? ' disabled' : ''}`}
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  );
} 