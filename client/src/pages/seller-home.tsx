import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useSeller } from "@/hooks/useSeller";
import { Package, Plus, Edit, Trash2, CheckCircle, XCircle, AlertCircle, DollarSign, TrendingUp, ShoppingCart, Store } from "lucide-react";
import { Link } from "wouter";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  co2SavedPerUnit: z.string().min(1, "CO₂ saved per unit is required"),
  stock: z.number().min(0, "Stock must be a positive number"),
  categoryId: z.number().min(1, "Category is required"),
  imageUrl: z.string().optional(),
});

const sellerRegistrationSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  certificationType: z.string().min(1, "Certification type is required"),
});

type ProductForm = z.infer<typeof productSchema>;
type SellerRegistrationForm = z.infer<typeof sellerRegistrationSchema>;

interface Product {
  id: number;
  name: string;
  description?: string;
  price: string;
  imageUrl?: string;
  co2SavedPerUnit: string;
  stock: number;
  categoryId: number;
  isActive: boolean;
  isVerified: boolean;
  verificationNotes?: string;
}

interface Order {
  id: number;
  totalAmount: string;
  status: string;
  createdAt: string;
  items: Array<{
    id: number;
    quantity: number;
    product: {
      name: string;
    };
  }>;
}

interface Seller {
  id: number;
  businessName: string;
  certificationType: string;
  isVerified: boolean;
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

export default function SellerHome() {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { seller, isRegisteredSeller, isVerifiedSeller, isLoading } = useSeller();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/sellers/products'],
    enabled: isRegisteredSeller,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/sellers/orders'],
    enabled: isRegisteredSeller,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      co2SavedPerUnit: "",
      stock: 0,
      categoryId: 0,
      imageUrl: "",
    },
  });

  const registrationForm = useForm<SellerRegistrationForm>({
    resolver: zodResolver(sellerRegistrationSchema),
    defaultValues: {
      businessName: "",
      certificationType: "",
    },
  });

  // Seller registration mutation
  const registerSellerMutation = useMutation({
    mutationFn: async (data: SellerRegistrationForm) => {
      const response = await fetch('/api/sellers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to register as seller');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Seller registration submitted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/sellers/profile'] });
      registrationForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Product management mutations
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const response = await fetch('/api/sellers/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create product');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Product created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/sellers/products'] });
      setShowAddProduct(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductForm & { id: number }) => {
      const response = await fetch(`/api/sellers/products/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Product updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/sellers/products'] });
      setEditingProduct(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch(`/api/sellers/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Product deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/sellers/products'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onProductSubmit = (data: ProductForm) => {
    if (editingProduct) {
      updateProductMutation.mutate({ ...data, id: editingProduct.id });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const onRegistrationSubmit = (data: SellerRegistrationForm) => {
    registerSellerMutation.mutate(data);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      co2SavedPerUnit: product.co2SavedPerUnit,
      stock: product.stock,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl || "",
    });
  };

  const handleDeleteProduct = (productId: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  // Calculate seller stats
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const verifiedProducts = products.filter(product => product.isVerified).length;
  const totalProducts = products.length;

  const getVerificationBadge = (product: Product) => {
    if (product.isVerified) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
    } else {
      return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pending Verification</Badge>;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p>Loading seller information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show registration form if user is not a seller
  if (!isRegisteredSeller) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 md:mb-8 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Become a Seller</h1>
              <p className="text-sm md:text-base text-gray-600 mb-4">Register your business to start selling sustainable products</p>
              <div className="mt-4">
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Go to Buyer Dashboard
                  </Link>
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Seller Registration</CardTitle>
                <CardDescription>
                  Fill out the form below to apply as a seller on our eco-friendly marketplace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={registrationForm.handleSubmit(onRegistrationSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input 
                      id="businessName" 
                      {...registrationForm.register("businessName")} 
                      placeholder="Your business or brand name"
                    />
                    {registrationForm.formState.errors.businessName && (
                      <p className="text-sm text-red-500">{registrationForm.formState.errors.businessName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="certificationType">Certification Type</Label>
                    <Select onValueChange={(value) => registrationForm.setValue("certificationType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your sustainability certification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="organic">Organic Certified</SelectItem>
                        <SelectItem value="fair-trade">Fair Trade Certified</SelectItem>
                        <SelectItem value="b-corp">B Corporation</SelectItem>
                        <SelectItem value="carbon-neutral">Carbon Neutral</SelectItem>
                        <SelectItem value="sustainable">Sustainable Practices</SelectItem>
                        <SelectItem value="eco-friendly">Eco-Friendly Products</SelectItem>
                        <SelectItem value="other">Other Certification</SelectItem>
                      </SelectContent>
                    </Select>
                    {registrationForm.formState.errors.certificationType && (
                      <p className="text-sm text-red-500">{registrationForm.formState.errors.certificationType.message}</p>
                    )}
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your seller application will be reviewed by our team. You'll be notified once approved.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={registerSellerMutation.isPending}
                  >
                    {registerSellerMutation.isPending ? 'Submitting...' : 'Apply to Become a Seller'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Seller Dashboard</h1>
          {seller && (
            <div>
              <p className="text-sm md:text-base text-gray-600">Welcome back, {seller.businessName}</p>
              {!seller.isVerified && (
                <Alert className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Your seller account is pending verification. You can add products, but they won't be visible to buyers until approved.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Seller Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-2xl font-bold">${totalRevenue.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Package className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-2xl font-bold">{totalProducts}</span>
                <span className="text-sm text-gray-500 ml-2">({verifiedProducts} verified)</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ShoppingCart className="h-4 w-4 text-orange-600 mr-1" />
                <span className="text-2xl font-bold">{pendingOrders}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Verification Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-purple-600 mr-1" />
                <span className="text-2xl font-bold">
                  {totalProducts > 0 ? Math.round((verifiedProducts / totalProducts) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Products</h2>
              <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    <DialogDescription>
                      Fill in the product details. All products will be reviewed for sustainability verification.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={form.handleSubmit(onProductSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Product Name</Label>
                        <Input id="name" {...form.register("name")} />
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="price">Price ($)</Label>
                        <Input id="price" {...form.register("price")} />
                        {form.formState.errors.price && (
                          <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" {...form.register("description")} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="co2SavedPerUnit">CO₂ Saved per Unit (kg)</Label>
                        <Input id="co2SavedPerUnit" {...form.register("co2SavedPerUnit")} />
                        {form.formState.errors.co2SavedPerUnit && (
                          <p className="text-sm text-red-500">{form.formState.errors.co2SavedPerUnit.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="stock">Stock Quantity</Label>
                        <Input 
                          id="stock" 
                          type="number" 
                          {...form.register("stock", { valueAsNumber: true })} 
                        />
                        {form.formState.errors.stock && (
                          <p className="text-sm text-red-500">{form.formState.errors.stock.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="categoryId">Category</Label>
                        <Select onValueChange={(value) => form.setValue("categoryId", parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.categoryId && (
                          <p className="text-sm text-red-500">{form.formState.errors.categoryId.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input id="imageUrl" {...form.register("imageUrl")} />
                      </div>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Products will be reviewed for sustainability verification before appearing in the buyer marketplace.
                      </AlertDescription>
                    </Alert>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setShowAddProduct(false);
                        setEditingProduct(null);
                        form.reset();
                      }}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createProductMutation.isPending || updateProductMutation.isPending}>
                        {editingProduct ? 'Update Product' : 'Add Product'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {products.length === 0 ? (
                <Card className="p-8 text-center">
                  <CardContent>
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Yet</h3>
                    <p className="text-gray-600 mb-4">Start by adding your first sustainable product</p>
                    <Button onClick={() => setShowAddProduct(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Product
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                products.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{product.name}</h3>
                            {getVerificationBadge(product)}
                          </div>
                          
                          <p className="text-gray-600 mb-2">{product.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Price:</span> ${product.price}
                            </div>
                            <div>
                              <span className="font-medium">Stock:</span> {product.stock}
                            </div>
                            <div>
                              <span className="font-medium">CO₂ Saved:</span> {product.co2SavedPerUnit} kg
                            </div>
                            <div>
                              <span className="font-medium">Status:</span>
                              <Badge variant={product.isActive ? "default" : "secondary"} className="ml-1">
                                {product.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                          
                          {product.verificationNotes && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="text-sm text-yellow-800">
                                <strong>Verification Notes:</strong> {product.verificationNotes}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              handleEditProduct(product);
                              setShowAddProduct(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={deleteProductMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            
            <div className="grid gap-4">
              {orders.length === 0 ? (
                <Card className="p-8 text-center">
                  <CardContent>
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
                    <p className="text-gray-600">Orders for your products will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                          <p className="text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          <div className="mt-2">
                            <Badge 
                              variant={order.status === 'completed' ? 'default' : 'secondary'}
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold">${order.totalAmount}</p>
                          <p className="text-sm text-gray-600">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Items:</h4>
                        <ul className="text-sm text-gray-600">
                          {order.items.map((item) => (
                            <li key={item.id}>
                              {item.quantity}x {item.product.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}