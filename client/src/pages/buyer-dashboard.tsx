import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductCard from "@/components/product-card";
import CartSidebar from "@/components/cart-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, Recycle, Award, Users, Search, Filter } from "lucide-react";
import { Link } from "wouter";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: string;
  imageUrl?: string;
  co2SavedPerUnit: string;
  ecoRating?: string;
  stock: number;
  sellerId: number;
  categoryId: number;
  isVerified: boolean;
}

interface GlobalStats {
  totalCo2Saved: string;
  treesPlanted: number;
  activeUsers: number;
}

interface UserStats {
  totalCo2Saved: string;
  totalPoints: number;
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

export default function BuyerDashboard() {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: globalStats } = useQuery<GlobalStats>({
    queryKey: ['/api/stats/global'],
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ['/api/stats/user'],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Filter products for buyers - only show verified products
  const verifiedProducts = products.filter((product: Product) => product.isVerified);
  
  // Apply search and category filters
  const filteredProducts = verifiedProducts.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === "all" || product.categoryId === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header onCartToggle={() => setCartOpen(true)} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Welcome to ecoKART</h1>
          <p className="text-base md:text-lg text-gray-600 mb-4 md:mb-6">Shop sustainable products and track your environmental impact</p>
          
          {/* User Impact Stats */}
          {userStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" />
                    Your CO₂ Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{userStats.totalCo2Saved} kg</div>
                  <p className="text-sm text-green-600">CO₂ saved through your purchases</p>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    Eco Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">{userStats.totalPoints}</div>
                  <p className="text-sm text-blue-600">Points earned from eco-friendly shopping</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Global Impact Stats */}
        {globalStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <Recycle className="h-6 w-6 text-green-600" />
                  CO₂ Saved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">{globalStats.totalCo2Saved}</div>
                <p className="text-sm text-gray-600">Total CO₂ saved by our community</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <Leaf className="h-6 w-6 text-green-600" />
                  Trees Planted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">{globalStats.treesPlanted}</div>
                <p className="text-sm text-gray-600">Equivalent trees planted</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">{globalStats.activeUsers}</div>
                <p className="text-sm text-gray-600">Eco-conscious shoppers</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col gap-3 md:flex-row md:gap-4 md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search sustainable products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/orders">
                View My Orders
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/cart">
                View Cart
              </Link>
            </Button>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Verified Sustainable Products</h2>
            <Badge variant="secondary" className="bg-green-100 text-green-800 self-start">
              {filteredProducts.length} products available
            </Badge>
          </div>
          
          {filteredProducts.length === 0 ? (
            <Card className="p-6 md:p-8 text-center">
              <CardContent>
                <Leaf className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
                <p className="text-gray-600 text-sm md:text-base">
                  {searchQuery || selectedCategory 
                    ? "Try adjusting your search or filter criteria." 
                    : "Verified sustainable products will appear here."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}