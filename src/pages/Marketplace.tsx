
import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Heart, Star, Tag, Filter, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Product type definition
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  isFavorite: boolean;
  isNew?: boolean;
  discount?: number;
}

// Sample product data
const sampleProducts: Product[] = [
  {
    id: 1,
    name: "Organic Baby Swaddle Blanket",
    price: 39.99,
    image: "/lovable-uploads/6f58574a-fde3-4270-b676-58b4ae30e40a.png",
    category: "Baby",
    rating: 4.8,
    isFavorite: false,
    isNew: true
  },
  {
    id: 2,
    name: "Postpartum Recovery Kit",
    price: 65.00,
    image: "/lovable-uploads/1d6249d4-897c-4dae-b4bd-e3111ccdbcf7.png",
    category: "Self-Care",
    rating: 4.9,
    isFavorite: true,
    discount: 15
  },
  {
    id: 3,
    name: "Nursing Friendly Dress",
    price: 48.50,
    image: "/lovable-uploads/89e1469f-4969-4cc2-89ce-4d7d1b6c3d77.png",
    category: "Fashion",
    rating: 4.6,
    isFavorite: false
  },
  {
    id: 4,
    name: "Baby Sleep Sound Machine",
    price: 32.99,
    image: "/lovable-uploads/768c6b7e-bbb9-43bd-a5bd-51357ef3c8a6.png",
    category: "Baby",
    rating: 4.7,
    isFavorite: false,
    discount: 10
  },
  {
    id: 5,
    name: "Mom & Baby Matching Set",
    price: 54.99,
    image: "/lovable-uploads/81d32dd9-43f6-4f6d-9b7e-1f78d2af3502.png",
    category: "Fashion",
    rating: 4.5,
    isFavorite: false,
    isNew: true
  },
  {
    id: 6,
    name: "Pregnancy Pillow",
    price: 59.99,
    image: "/lovable-uploads/449d7c5a-fc0b-41da-aa67-e1e7c8908526.png",
    category: "Self-Care",
    rating: 4.9,
    isFavorite: true
  }
];

// Category pill component
const CategoryPill = ({ name, isActive, onClick }: { name: string; isActive: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
      isActive 
        ? 'bg-nuumi-pink text-white shadow-md' 
        : 'bg-card text-muted-foreground hover:bg-secondary/80'
    }`}
  >
    {name}
  </button>
);

// Product card component
const ProductCard = ({ product }: { product: Product }) => {
  const [isFavorite, setIsFavorite] = useState(product.isFavorite);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="overflow-hidden border-border/40 hover:border-nuumi-pink/40 transition-all duration-300 hover:shadow-md">
        <div className="relative overflow-hidden aspect-square bg-muted/30">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
          
          {/* Favorite button */}
          <button 
            onClick={() => setIsFavorite(!isFavorite)}
            className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-white transition-colors"
          >
            <Heart 
              size={16} 
              className={isFavorite ? "fill-nuumi-pink text-nuumi-pink" : "text-muted-foreground"} 
            />
          </button>
          
          {/* New tag or discount */}
          {product.isNew && (
            <div className="absolute top-2 left-2 bg-nuumi-pink text-white text-xs px-2 py-0.5 rounded-full">
              New
            </div>
          )}
          
          {product.discount && (
            <div className="absolute top-2 left-2 bg-secondary text-white text-xs px-2 py-0.5 rounded-full">
              {product.discount}% Off
            </div>
          )}
        </div>
        
        <CardContent className="p-3">
          <div className="flex items-center gap-1 mb-1">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-muted-foreground">{product.rating}</span>
          </div>
          
          <h3 className="font-medium text-sm line-clamp-1 mb-1">{product.name}</h3>
          
          <div className="flex items-center justify-between">
            <div>
              {product.discount ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-nuumi-pink">${(product.price * (1 - product.discount / 100)).toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground line-through">${product.price}</span>
                </div>
              ) : (
                <span className="font-semibold text-nuumi-pink">${product.price}</span>
              )}
            </div>
            
            <button className="bg-secondary hover:bg-secondary/80 p-1.5 rounded-full transition-colors">
              <ShoppingBag size={14} className="text-foreground" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Marketplace = () => {
  const categories = ["All", "Baby", "Self-Care", "Fashion", "Home", "Nutrition"];
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter products based on active category and search query
  const filteredProducts = sampleProducts.filter(product => {
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Marketplace" />
      
      <div className="max-w-md mx-auto px-4 pt-3">
        {/* Featured banner */}
        <div className="w-full h-32 rounded-xl mb-4 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-nuumi-pink/90 to-nuumi-pink/70" />
          <div className="absolute inset-0 flex flex-col justify-center p-4">
            <h2 className="text-white font-semibold text-xl">Mother's Day Sale</h2>
            <p className="text-white/90 text-sm">Up to 30% off on selected items</p>
            <button className="mt-2 bg-white text-nuumi-pink text-xs font-medium px-3 py-1 rounded-full w-fit">
              Shop Now
            </button>
          </div>
          <div className="absolute right-0 bottom-0">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M80 20C80 20 90 40 70 60C50 80 30 70 30 70" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M30 70C30 70 50 90 70 70C90 50 80 30 80 30" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        
        {/* Search bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={16} className="text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className="w-full bg-card border border-border/40 rounded-full py-2 pl-10 pr-4 text-sm focus:border-nuumi-pink focus:outline-none focus:ring-1 focus:ring-nuumi-pink/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Categories */}
        <div className="mb-4 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 pb-1">
            {categories.map(category => (
              <CategoryPill
                key={category}
                name={category}
                isActive={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              />
            ))}
          </div>
        </div>
        
        {/* Products grid */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-2 py-10 text-center text-muted-foreground">
              <ShoppingBag className="mx-auto mb-2 text-muted-foreground/50" />
              <p>No products found</p>
              <button 
                onClick={() => {
                  setActiveCategory("All");
                  setSearchQuery("");
                }}
                className="mt-2 text-xs text-nuumi-pink"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
