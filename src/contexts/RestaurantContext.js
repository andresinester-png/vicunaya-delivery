import { createContext, useContext } from 'react';

export const RestaurantContext = createContext(null);
export const useRestaurant = () => useContext(RestaurantContext);
