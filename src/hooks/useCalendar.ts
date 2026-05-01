// src/hooks/useCalendar.ts
import { useState, useMemo } from "react";
import { useRestaurants } from "../context/RestaurantsContext";

export type CalendarItem = {
  id: string;
  restaurantId: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  description?: string;
};

export const useCalendar = () => {
  // Consumimos los datos del contexto
  const { restaurants } = useRestaurants();

  // Estado para el filtro de tiempo
  const [selectedDay, setSelectedDay] = useState<"Hoy" | "Semana" | "Mes">("Hoy");

  // Motor de agregación y filtrado aislado en el Hook
  const items: CalendarItem[] = useMemo(() => {
    const allEvents: CalendarItem[] = [];

    restaurants.forEach((r) => {
      if (r.events && r.events.length > 0) {
        r.events.forEach((e) => {
          allEvents.push({
            id: e.id,
            restaurantId: r.id,
            title: e.title,
            subtitle: r.name,
            dateLabel: e.dateLabel || "",
            description: e.description,
          });
        });
      }
    });

    const filtered = allEvents.filter((item) => {
      const label = (item.dateLabel || "").toLowerCase();

      if (selectedDay === "Hoy") {
        return label.includes("hoy");
      }
      if (selectedDay === "Semana") {
        const weekKeywords = [
          "lunes", "martes", "miércoles", "miercoles", "jueves",
          "viernes", "sábado", "sabado", "domingo", "mañana",
          "semana", "fin de semana", "hoy",
        ];
        return weekKeywords.some((kw) => label.includes(kw));
      }
      return true; // "Mes" muestra todo
    });

    return filtered.reverse();
  }, [restaurants, selectedDay]);

  // Exponemos solo lo que la vista necesita
  return {
    items,
    selectedDay,
    setSelectedDay
  };
};