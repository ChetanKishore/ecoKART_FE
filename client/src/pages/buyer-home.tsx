import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/product-card";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Users, TreePine } from "lucide-react";

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

export default function BuyerHome() {
  const { user } = useAuth();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: globalStats } = useQuery<GlobalStats>({
    queryKey: ["/api/stats/global"],
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/stats/user"],
  });

  // Filter only verified products for buyers
  const verifiedProducts = products.filter((product: Product) => product.isVerified);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-800 dark:text-green-200 mb-4">
            Welcome to ecoKART Marketplace
          </h1>
          <p className="text-lg text-green-600 dark:text-green-300 mb-8">
            Discover verified sustainable products that help save our planet
          </p>
          
          {/* Global Impact Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-center mb-2">
                <Leaf className="h-8 w-8 text-green-600 mr-2" />
                <span className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {globalStats?.totalCo2Saved || 0}kg
                </span>
              </div>
              <p className="text-green-600 dark:text-green-300">Total CO₂ Saved</p>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-center mb-2">
                <TreePine className="h-8 w-8 text-green-600 mr-2" />
                <span className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {globalStats?.treesPlanted || 0}
                </span>
              </div>
              <p className="text-green-600 dark:text-green-300">Trees Planted</p>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-green-600 mr-2" />
                <span className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {globalStats?.activeUsers || 0}
                </span>
              </div>
              <p className="text-green-600 dark:text-green-300">Eco Warriors</p>
            </div>
          </div>

          {/* Personal Stats */}
          {user && userStats && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">Your Environmental Impact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-2xl font-bold">{userStats.totalCo2Saved}kg</span>
                  <p className="text-green-100">CO₂ Saved</p>
                </div>
                <div>
                  <span className="text-2xl font-bold">{userStats.totalPoints}</span>
                  <p className="text-green-100">Eco Points</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">
              Verified Sustainable Products
            </h2>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {verifiedProducts.length} Products Available
            </Badge>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 animate-pulse">
                  <div className="bg-gray-300 dark:bg-gray-600 h-48 rounded-md mb-4"></div>
                  <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded mb-2"></div>
                  <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : verifiedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {verifiedProducts.map((product: Product) => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} />
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-2 bg-green-100 text-green-800"
                  >
                    Verified
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Leaf className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
                No verified products yet
              </h3>
              <p className="text-green-600 dark:text-green-300">
                Check back soon for new sustainable products!
              </p>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-4">
            Ready to Make a Difference?
          </h3>
          <p className="text-green-600 dark:text-green-300 mb-6">
            Every purchase helps reduce carbon footprint and supports sustainable businesses
          </p>
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            Start Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}