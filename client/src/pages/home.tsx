import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductCard from "@/components/product-card";
import CartSidebar from "@/components/cart-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, Sprout, Users } from "lucide-react";
import SellerDashboard from "./seller-dashboard";

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

export default function Home() {
  const [activeTab, setActiveTab] = useState("shop");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sellerFilter, setSellerFilter] = useState<string>("all");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: globalStats } = useQuery<GlobalStats>({
    queryKey: ["/api/stats/global"],
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/stats/user"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const filteredProducts = products.filter(product => {
    if (categoryFilter !== "all" && product.categoryId !== parseInt(categoryFilter)) return false;
    if (sellerFilter !== "all" && product.sellerId !== parseInt(sellerFilter)) return false;
    if (priceRange !== "all") {
      const price = parseFloat(product.price);
      switch (priceRange) {
        case "under-25": return price < 25;
        case "25-50": return price >= 25 && price <= 50;
        case "50-100": return price >= 50 && price <= 100;
        case "over-100": return price > 100;
        default: return true;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onCartToggle={() => setIsCartOpen(!isCartOpen)} />
      
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="shop" className="flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                Shop
              </TabsTrigger>
              <TabsTrigger value="sell" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Sell
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="shop" className="space-y-8">
            {/* Hero Section */}
            <div className="relative rounded-2xl overflow-hidden mb-12 h-96 bg-cover bg-center" 
                 style={{backgroundImage: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600')"}}>
              <div className="relative z-10 flex flex-col justify-center items-center h-full text-white text-center px-4">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  Shop <span className="text-green-400">Sustainably</span>
                </h1>
                <p className="text-xl md:text-2xl mb-8 max-w-2xl">
                  Every purchase helps reduce CO2 emissions and supports eco-friendly businesses
                </p>
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <Button size="lg" className="eco-primary">
                    Start Shopping
                  </Button>
                  <div className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Leaf className="text-green-400 h-5 w-5" />
                    <span className="text-sm">{globalStats?.totalCo2Saved || "0"} kg CO2 saved this month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
              <div className="flex flex-wrap items-center space-x-4">
                <Select value={sellerFilter} onValueChange={setSellerFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Sellers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sellers</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="under-25">Under $25</SelectItem>
                    <SelectItem value="25-50">$25 - $50</SelectItem>
                    <SelectItem value="50-100">$50 - $100</SelectItem>
                    <SelectItem value="over-100">Over $100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <Select defaultValue="co2">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="co2">Most CO2 Savings</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {productsLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="flex justify-between">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">No products found matching your filters.</p>
                </div>
              )}
            </div>

            {/* CO2 Impact Section */}
            <Card className="eco-gradient text-white">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-3xl font-bold mb-2">{globalStats?.totalCo2Saved || "0"}</div>
                    <div className="text-green-200">kg CO2 Saved</div>
                    <div className="text-sm text-green-100 mt-1">This Month</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold mb-2">{globalStats?.treesPlanted || 0}</div>
                    <div className="text-green-200">Trees Planted</div>
                    <div className="text-sm text-green-100 mt-1">Through Your Points</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold mb-2">{globalStats?.activeUsers || 0}</div>
                    <div className="text-green-200">Eco Warriors</div>
                    <div className="text-sm text-green-100 mt-1">Active Users</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Points & Rewards Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Your Eco Points</h2>
                  <div className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full">
                    <Sprout className="text-green-600 h-5 w-5" />
                    <span className="font-bold text-green-800">{userStats?.totalPoints || 0} points</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-2">Plant Trees</h3>
                    <p className="text-sm text-green-700 mb-4">Use 50 points to plant a tree and offset more CO2</p>
                    <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                      Donate Points
                    </Button>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Your Impact</h3>
                    <p className="text-sm text-blue-700 mb-2">You have saved</p>
                    <div className="text-2xl font-bold text-blue-900">{userStats?.totalCo2Saved || "0"} kg CO2</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sell">
            <SellerDashboard />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
