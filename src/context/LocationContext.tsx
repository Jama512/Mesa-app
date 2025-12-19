import React, { createContext, useContext, useMemo, useState } from "react";

type Coords = { latitude: number; longitude: number };

type LocationState = {
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
      coords: next.coords ?? prev.coords,
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
