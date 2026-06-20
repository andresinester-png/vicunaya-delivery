import { createContext, useContext } from 'react';
export const TurnosNegocioContext = createContext(null);
export const useTurnosNegocio = () => useContext(TurnosNegocioContext);
