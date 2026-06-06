import { createContext, useContext, ReactNode } from 'react';
import { useStore } from '../store';

type StoreType = ReturnType<typeof useStore>;

const StoreContext = createContext<StoreType | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const store = useStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

export const useAppStore = () => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useAppStore must be used within StoreProvider');
  }
  return store;
};
