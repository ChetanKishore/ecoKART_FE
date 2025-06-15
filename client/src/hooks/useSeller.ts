import { useQuery } from "@tanstack/react-query";

interface Seller {
  id: number;
  businessName: string;
  certificationType: string;
  isVerified: boolean;
}

export function useSeller() {
  const { data: seller, error, isLoading } = useQuery<Seller>({
    queryKey: ['/api/sellers/profile'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isRegisteredSeller = !error && !!seller;
  const isVerifiedSeller = isRegisteredSeller && seller?.isVerified;

  return {
    seller,
    isRegisteredSeller,
    isVerifiedSeller,
    isLoading,
    error,
  };
}