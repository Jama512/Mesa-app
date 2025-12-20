// src/context/LocationContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";

// ✅ 1. EXPORTAR LOS TIPOS (Esto corrige los errores en los otros archivos)
export type Coords = { latitude: number; longitude: number };

export type LocationState = {
  coords: Coords | null;
  label: string;
};

type LocationContextValue = {
  location: LocationState;
  setLocation: (next: Partial<LocationState>) => void;
  clearLocation: () => void;
};

const LocationContext = createContext<LocationContextValue | undefined>(
  undefined
);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [location, setLocationState] = useState<LocationState>({
    coords: null,
    label: "Cerca de Zona Centro",
  });

  const setLocation = (next: Partial<LocationState>) => {
    setLocationState((prev) => ({
      ...prev,
      ...next,
      // Si next.coords viene (incluso si es null), lo usamos. Si es undefined, mantenemos el previo.
      coords: next.coords !== undefined ? next.coords : prev.coords,
      label: next.label ?? prev.label,
    }));
  };

  const clearLocation = () => {
    setLocationState({ coords: null, label: "Cerca de Zona Centro" });
  };

  const value = useMemo(
    () => ({ location, setLocation, clearLocation }),
    [location]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationState = () => {
  const ctx = useContext(LocationContext);
  if (!ctx)
    throw new Error("useLocationState debe usarse dentro de LocationProvider");
  return ctx;
};
