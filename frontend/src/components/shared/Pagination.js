/**
 * Composant Pagination réutilisable
 * Compatible thèmes admin et public (fond sombre)
 */

import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ page, totalPages, total, itemsPerPage, onPageChange, activeColor = "#7c9a92" }) => {
  if (!totalPages || totalPages <= 1) return null;

  const from = Math.min((page - 1) * itemsPerPage + 1, total);
  const to = Math.min(page * itemsPerPage, total);

  // Génération des numéros de pages avec ellipsis
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  };

  const btnBase = "flex items-center justify-center rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      <p className="text-sm text-gray-400">
        {from}–{to} sur <span className="font-medium text-gray-300">{total}</span> résultat{total > 1 ? "s" : ""}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={`${btnBase} w-8 h-8`}
          style={{ background: "rgba(255,255,255,0.06)", color: "#9ca3af" }}
          aria-label="Page précédente"
        >
          <ChevronLeft size={16} />
        </button>

        {getPages().map((p, i) =>
          p === "…" ? (
            <span key={`dots-${i}`} className="w-6 text-center text-gray-500 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${btnBase} w-8 h-8 font-medium`}
              style={{
                background: p === page ? activeColor : "rgba(255,255,255,0.06)",
                color: p === page ? "#fff" : "#9ca3af"
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={`${btnBase} w-8 h-8`}
          style={{ background: "rgba(255,255,255,0.06)", color: "#9ca3af" }}
          aria-label="Page suivante"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
