import React from "react";

type AiraloPackage = {
  id: string;
  country: string;
  region?: string | null;
  name: string;
  data: string;
  validity: string;
  final_price_eur: number;
};

export default function PackageCard({ pkg }: { pkg: AiraloPackage }) {
  return (
    <div className="bg-white border rounded-xl p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-bold text-lg truncate">{pkg.name}</h3>
          <p className="text-sm text-gray-500">
            {pkg.country}
            {pkg.region ? ` • ${pkg.region}` : ""}
          </p>
        </div>
        <div className="text-right whitespace-nowrap">
          <p className="font-black text-xl">{Number(pkg.final_price_eur).toFixed(2)}€</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold">
          Data: {pkg.data}
        </span>
        <span className="px-2 py-1 rounded-full bg-orange-50 text-orange-700 font-semibold">
          Validité: {pkg.validity}
        </span>
      </div>

      <button
        className="mt-5 w-full rounded-lg bg-black text-white font-bold py-2 hover:opacity-90"
        onClick={() => alert("TODO: Checkout")}
      >
        Choisir ce forfait
      </button>
    </div>
  );
}
