/**
 * Archivo central para todos los tipos TypeScript de la aplicación MESA
 */

// ==========================================
// TIPOS BÁSICOS DE LA APLICACIÓN
// ==========================================
/**
 * Tipo para identificadores únicos
 */
export type ID = string | number; // Usamos string o number

// ==========================================
// INTERFACES DE ENTIDADES "MESA"
// ==========================================
/**
 * Interfaz base para entidades que tienen ID
 */
export interface BaseEntity {
  id: ID;
}

/**
 * Interfaz para un Usuario (simplificada)
 */
export interface User extends BaseEntity {
  id: ID;
  fullName: string;
  email: string;
  // Nota: Nunca almacenamos la contraseña aquí
}

/**
 * Interfaz para una Categoría (Pizzerías, Mexicana, etc.)
 */
export interface Category extends BaseEntity {
  id: ID;
  title: string;
  image: any; // Para require()
}

/**
 * Interfaz para un Producto/Platillo (ej. "Pizza Pepperoni")
 */
export interface FoodItem extends BaseEntity {
  id: ID;
  name: string;
  description: string;
  price: number; // Usar número para el precio
  image: any;
  categoryId: ID; // Para saber a qué categoría pertenece
}

// ==========================================
// TIPOS PARA COMPONENTES UI
// ==========================================
/**
 * Props para componentes de Card/Tarjeta
 * (Útil para nuestras tarjetas de categoría)
 */
export interface CardProps {
  titulo: string;
  subtitulo?: string;
  onPress?: () => void;
  icono?: string;
  imagen?: any; // Para require() de imágenes
}

/**
 * Props para componentes de Lista
 * (Útil para nuestra lista de platillos)
 */
export interface ListItemProps<T> {
  item: T;
  onPress?: (item: T) => void;
  onAdd?: (item: T) => void; // Específico para añadir al carrito
}

// ==========================================
// TIPOS PARA FORMULARIOS
// ==========================================
/**
 * Datos del formulario de Login 
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Datos del formulario de Sign Up (Nuevo)
 */
export interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ==========================================
// TIPOS PARA GESTIÓN DE ESTADOS
// ==========================================
/**
 * Estados de carga para operaciones asíncronas
 */
export type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * Estructura para manejo de errores
 */
export interface ErrorState {
  hasError: boolean;
  message?: string;
}

/**
 * Estado general de una pantalla con datos
 */
export interface ScreenState<T> {
  data: T[];
  loading: LoadingState;
  error: ErrorState;
}

// ==========================================
// CONSTANTES DE TIPO 
// ==========================================
/**
 * Colores principales de la aplicación MESA
 */
export const COLORS = {
  primary: "#E67E22", // Naranja MESA
  secondary: "#2C2C2C", // Gris Oscuro (Headers)
  background: "#F4F4F4", // Fondo claro
  surface: "#FFFFFF", // Blanco (Tarjetas)
  error: "#b00020", // Rojo estándar para errores
  text: "#333333", // Texto principal oscuro
  textSecondary: "#757575", // Texto gris (inactivo o subtítulos)
};

/**
 * Tamaños de fuente estándar
 */
export const FONT_SIZES = {
  small: 14,
  medium: 16,
  large: 18,
  xlarge: 22,
  xxlarge: 24,
};
