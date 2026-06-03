// src/services/database.service.ts
import * as SQLite from 'expo-sqlite';

// Abrimos la base de datos con la API moderna síncrona
const db = SQLite.openDatabaseSync('mesa_offline.db');

// 1. Inicializar Tablas
export const initDB = () => {
  try {
    // execSync permite correr varias consultas de golpe
    db.execSync(`
      CREATE TABLE IF NOT EXISTS session (id INTEGER PRIMARY KEY NOT NULL, token TEXT, user_data TEXT);
      CREATE TABLE IF NOT EXISTS restaurants (id TEXT PRIMARY KEY NOT NULL, data TEXT);
    `);
    console.log('✅ Tablas SQLite cargadas correctamente');
  } catch (error) {
    console.log('Error creando tablas', error);
  }
};

// --- FUNCIONES DE SESIÓN ---

// Guardar el token cuando hay internet
export const saveSessionLocally = (token: string, userData: any) => {
  try {
    db.runSync(
      'INSERT OR REPLACE INTO session (id, token, user_data) VALUES (1, ?, ?);',
      token,
      JSON.stringify(userData)
    );
  } catch (error) {
    console.log('Error al guardar sesión:', error);
  }
};

// Leer el token cuando estamos offline
export const getLocalSession = async (): Promise<any> => {
  try {
    // getFirstSync devuelve directamente la primera fila encontrada
    const result: any = db.getFirstSync('SELECT * FROM session WHERE id = 1;');
    return result ? result : null;
  } catch (error) {
    console.log('Error al leer sesión:', error);
    return null;
  }
};

// Borrar la sesión (Logout)
export const clearLocalSession = () => {
  try {
    db.runSync('DELETE FROM session WHERE id = 1;');
  } catch (error) {
    console.log('Error al borrar sesión:', error);
  }
};

// --- FUNCIONES DE RESTAURANTES (Offline-First) ---

// Guardar lista de restaurantes que viene de Firebase/FastAPI
export const saveRestaurantsLocally = (restaurantsArray: any[]) => {
  try {
    // Primero limpiamos la tabla
    db.runSync('DELETE FROM restaurants;');
    
    // Luego insertamos los nuevos
    for (const rest of restaurantsArray) {
      db.runSync(
        'INSERT INTO restaurants (id, data) VALUES (?, ?);',
        rest.id,
        JSON.stringify(rest)
      );
    }
  } catch (error) {
    console.log('Error al guardar restaurantes:', error);
  }
};

// Leer restaurantes cuando no hay internet
export const getLocalRestaurants = async (): Promise<any[]> => {
  try {
    // getAllSync devuelve un arreglo con todas las filas
    const result: any[] = db.getAllSync('SELECT * FROM restaurants;');
    
    // Convertimos el string JSON de vuelta a objeto
    return result.map(row => JSON.parse(row.data));
  } catch (error) {
    console.log('Error al leer restaurantes:', error);
    return [];
  }
};