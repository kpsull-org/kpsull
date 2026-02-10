"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Filter } from "lucide-react";

// SEO metadata will be handled by generateMetadata in a server component wrapper later
// For now, this is a client component with static data

const STYLE_FILTERS = [
  "Streetstyle",
  "Scandi",
  "Classic",
  "Avant-garde",
  "Sportif",
  "Y2K",
];

const SIZE_FILTERS = ["XS", "S", "M", "L", "XL"];

// Placeholder product data
const PLACEHOLDER_PRODUCTS = [
  { id: 1, name: "Veste en jean oversized", price: 89 },
  { id: 2, name: "T-shirt basique blanc", price: 25 },
  { id: 3, name: "Pantalon cargo noir", price: 75 },
  { id: 4, name: "Robe midi fleurie", price: 120 },
  { id: 5, name: "Chemise rayée", price: 65 },
  { id: 6, name: "Pull col roulé", price: 95 },
  { id: 7, name: "Jupe plissée", price: 80 },
  { id: 8, name: "Blouson cuir", price: 280 },
];

function FilterSection() {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="font-montserrat font-bold text-sm uppercase tracking-wide">
        Filtres
      </h2>

      {/* Style Filters */}
      <div className="space-y-3">
        <h3 className="font-montserrat font-semibold text-sm uppercase text-muted-foreground">
          Style
        </h3>
        <div className="space-y-2">
          {STYLE_FILTERS.map((style) => (
            <div key={style} className="flex items-center space-x-2">
              <Checkbox
                id={`style-${style}`}
                checked={selectedStyles.includes(style)}
                onCheckedChange={() => toggleStyle(style)}
              />
              <Label
                htmlFor={`style-${style}`}
                className="text-sm font-normal cursor-pointer"
              >
                {style}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Size Filters */}
      <div className="space-y-3">
        <h3 className="font-montserrat font-semibold text-sm uppercase text-muted-foreground">
          Taille
        </h3>
        <div className="flex flex-wrap gap-2">
          {SIZE_FILTERS.map((size) => (
            <div key={size} className="flex items-center space-x-2">
              <Checkbox
                id={`size-${size}`}
                checked={selectedSizes.includes(size)}
                onCheckedChange={() => toggleSize(size)}
              />
              <Label
                htmlFor={`size-${size}`}
                className="text-sm font-normal cursor-pointer"
              >
                {size}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-montserrat font-semibold text-sm uppercase text-muted-foreground">
          Prix
        </h3>
        <p className="text-sm text-foreground">0EUR - 500EUR</p>
      </div>
    </div>
  );
}

export default function CataloguePage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 pr-8 border-r border-border flex-shrink-0">
          <FilterSection />
        </aside>

        {/* Mobile Filter Button */}
        <div className="md:hidden mb-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <FilterSection />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <main className="flex-1">
          <div className="mb-8">
            <h1 className="font-montserrat font-bold text-3xl md:text-5xl uppercase tracking-tight mb-2">
              Catalogue
            </h1>
            <p className="text-muted-foreground font-montserrat text-sm">
              {PLACEHOLDER_PRODUCTS.length} produits
            </p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {PLACEHOLDER_PRODUCTS.map((product) => (
              <div key={product.id} className="group cursor-pointer">
                {/* Product Image Placeholder */}
                <div className="aspect-[3/4] bg-muted rounded-[15px] mb-3 transition-transform group-hover:scale-[1.02]" />

                {/* Product Info */}
                <h3 className="font-montserrat font-semibold text-sm uppercase mb-1">
                  {product.name}
                </h3>
                <p className="font-montserrat font-bold text-base">
                  {product.price}EUR
                </p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
