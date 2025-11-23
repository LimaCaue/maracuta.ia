import React from "react"

export default function Loading() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[100]"
      role="alert"
      aria-busy="true"
      aria-label="Carregando"
    >
      <div className="flex flex-col items-center gap-4">
        <ShieldIcon className="w-20 h-20 animate-pulse drop-shadow-lg text-white" />
        <p className="text-sm font-medium text-white tracking-wide">
          Protegendo você contra riscos legislativos...
        </p>
      </div>
    </div>
  )
}

function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2.75c-.41 0-.82.09-1.19.27L5.5 5.21A2.25 2.25 0 0 0 4.25 7.2v6.07c0 2.9 1.62 5.59 4.23 7.02l2.67 1.44c.55.3 1.21.3 1.76 0l2.67-1.44c2.61-1.43 4.23-4.12 4.23-7.02V7.2c0-.84-.48-1.6-1.25-1.99l-5.31-2.19c-.37-.18-.78-.27-1.19-.27Zm0 2.0c.14 0 .28.03.41.09l5.09 2.1c.3.13.5.43.5.76v6.12c0 2.36-1.32 4.51-3.43 5.66L12.5 21c-.3.16-.7.16-1 0l-2.07-1.12C7.32 18.33 6 16.18 6 13.82V7.7c0-.33.2-.63.5-.76l5.09-2.1c.13-.06.27-.09.41-.09Zm0 3.0a1 1 0 0 0-1 1v3.25H9a1 1 0 1 0 0 2h2v3.25a1 1 0 1 0 2 0V14h2a1 1 0 1 0 0-2h-2V8.75a1 1 0 0 0-1-1Z" />
    </svg>
  )
}