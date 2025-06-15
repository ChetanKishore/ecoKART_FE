import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Leaf, Star, Shield } from "lucide-react";
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
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: 1,
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Login Required",
          description: "Please log in to add items to cart",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCartMutation.mutate();
  };

  const getCertificationBadge = () => {
    // Mock certification based on CO2 savings
    const co2Value = parseFloat(product.co2SavedPerUnit);
    if (co2Value > 5) return { label: "Certified Organic", color: "bg-green-100 text-green-800" };
    if (co2Value > 3) return { label: "Zero Waste", color: "bg-blue-100 text-blue-800" };
    if (co2Value > 2) return { label: "Solar Powered", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Plastic-Free", color: "bg-purple-100 text-purple-800" };
  };

  const certification = getCertificationBadge();

  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200 cursor-pointer group">
        <div className="relative">
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"}
            alt={product.name}
            className="w-full h-40 md:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold">Out of Stock</span>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge className={certification.color}>
              <Shield className="h-3 w-3 mr-1" />
              {certification.label}
            </Badge>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">{product.ecoRating || "4.8"}</span>
            </div>
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
          <p className="text-sm text-gray-600 mb-2">by EcoFarm Co.</p>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-gray-900">${product.price}</span>
            <div className="flex items-center space-x-1 text-green-600">
              <Leaf className="h-3 w-3" />
              <span className="text-xs font-medium">{product.co2SavedPerUnit}kg CO2 saved</span>
            </div>
          </div>
          
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addToCartMutation.isPending}
            className="w-full eco-primary text-sm font-medium transition-colors"
          >
            {addToCartMutation.isPending ? "Adding..." : product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </Link>
  );
}
