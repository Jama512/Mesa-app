import React, { createContext, useContext, useState, ReactNode } from "react";

type UserRole = "guest" | "owner";

export interface RestaurantFeatures {
  wifi: boolean;
  outdoorSeating: boolean;
  parking: boolean;
  reservations: boolean;
  delivery: boolean;
  cardPayment: boolean;
}

export interface RestaurantProfile {
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  features?: RestaurantFeatures;
  images?: string[]; // URIs locales de las fotos
}

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole;
  email?: string;
  restaurant?: RestaurantProfile;
}

interface LoginPayload {
  email: string;
  restaurantName?: string;
}

interface AuthContextValue {
  state: AuthState;
  loginAsOwner: (data: LoginPayload) => void;
  continueAsGuest: () => void;
  logout: () => void;
  updateRestaurant: (data: Partial<RestaurantProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    role: "guest",
  });

  const loginAsOwner = ({ email, restaurantName }: LoginPayload) => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      role: "owner",
      email,
      restaurant: {
        name:
          restaurantName ||
          prev.restaurant?.name ||
          "Restaurante no configurado",
        address: prev.restaurant?.address,
        phone: prev.restaurant?.phone,
        description: prev.restaurant?.description,
        latitude: prev.restaurant?.latitude,
        longitude: prev.restaurant?.longitude,
        features: prev.restaurant?.features,
        images: prev.restaurant?.images,
      },
    }));
  };

  const continueAsGuest = () => {
    setState({
      isAuthenticated: false,
      role: "guest",
      email: undefined,
      restaurant: undefined,
    });
  };

  const logout = () => {
    setState({
      isAuthenticated: false,
      role: "guest",
      email: undefined,
      restaurant: undefined,
    });
  };

  const updateRestaurant = (data: Partial<RestaurantProfile>) => {
    setState((prev) => {
      const prevRest = prev.restaurant ?? {
        name: "Restaurante no configurado",
      };

      return {
        ...prev,
        restaurant: {
          ...prevRest,
          ...data,
          // fusionar features si vienen parciales
          features: {
            wifi: prevRest.features?.wifi ?? false,
            outdoorSeating: prevRest.features?.outdoorSeating ?? false,
            parking: prevRest.features?.parking ?? false,
            reservations: prevRest.features?.reservations ?? false,
            delivery: prevRest.features?.delivery ?? false,
            cardPayment: prevRest.features?.cardPayment ?? false,
            ...(data.features ?? {}),
          },
          // si mandas un array completo de imágenes, lo sustituye
          images: data.images ?? prevRest.images,
        },
      };
    });
  };

  return (
    <AuthContext.Provider
      value={{ state, loginAsOwner, continueAsGuest, logout, updateRestaurant }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
};
