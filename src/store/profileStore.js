import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useProfileStore = create(
  persist(
    (set) => ({
      name: '',
      phone: '',
      address: '',
      setProfile: (data) => set(data),
    }),
    { name: 'vicunaya-profile' }
  )
);

export default useProfileStore;
