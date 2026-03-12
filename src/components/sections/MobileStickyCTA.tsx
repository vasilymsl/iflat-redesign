"use client";

import Link from "next/link";

export function MobileStickyCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg z-40 lg:hidden">
      <Link
        href="/internet/flat"
        className="block w-full text-center py-3.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover transition-colors"
      >
        Подключить интернет
      </Link>
    </div>
  );
}
