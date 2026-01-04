import React from "react";

export type AiraloPackage = {
  id: string;
  country: string;
  region?: string | null;
  name: string;
  data: string;
  validity: string;
  final_price_eur: number;
};

type PackageCardProps = {
  pkg: AiraloPackage;
};

export default function PackageCard({ pkg }: PackageCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-bold text-lg truncate text-gray-900">
            {pkg.name}
          </h3>
          <p className="text-sm text-gray-500">
            {pkg.country}
            {pkg.region ? ` • ${pkg.region}` : ""}
          </p>
        </div>

        <div className="text-right whitespace-nowrap">
          <p className="font-extrabold text-xl text-gray-900">
            {Number(pkg.final_price_eur).toFixed(2)} €
          </p>
        </div>
      </div>

      {/* Infos */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold">
          📶 {pkg.data}
        </span>
        <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 font-semibold">
          ⏱ {pkg.validity}
        </span>
      </div>

      {/* CTA */}
      <button
        className="mt-5 w-full rounded-lg bg-black text-white font-bold py-2 hover:bg-gray-900 transition"
        onClick={() => {
          // TODO: Stripe checkout / Airalo order
          alert("Checkout à implémenter");
        }}
      >
        Choisir ce forfait
      </button>
    </div>
  );
}
