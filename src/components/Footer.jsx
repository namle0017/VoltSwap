// src/components/Footer.jsx
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-center text-sm text-gray-500">
        © {new Date().getFullYear()} EVSwap — All rights reserved.
      </div>
    </footer>
  );
}
