// Adaptador que usa window.storage en producción y localStorage en desarrollo

interface StorageResult {
  key: string;
  value: string;
  shared: boolean;
}

interface StorageListResult {
  keys: string[];
  prefix?: string;
  shared: boolean;
}

class LocalStorageAdapter {
  async get(key: string): Promise<StorageResult | null> {
    const value = localStorage.getItem(key);
    if (value === null) {
      throw new Error(`Key "${key}" not found`);
    }
    return { key, value, shared: false };
  }

  async set(key: string, value: string): Promise<StorageResult | null> {
    localStorage.setItem(key, value);
    return { key, value, shared: false };
  }

  async delete(key: string): Promise<{ key: string; deleted: boolean; shared: boolean } | null> {
    const existed = localStorage.getItem(key) !== null;
    localStorage.removeItem(key);
    return { key, deleted: existed, shared: false };
  }

  async list(prefix?: string): Promise<StorageListResult | null> {
    const keys = Object.keys(localStorage);
    const filteredKeys = prefix ? keys.filter(k => k.startsWith(prefix)) : keys;
    return { keys: filteredKeys, prefix, shared: false };
  }
}

// Exportar el storage adapter correcto
export const storageAdapter = (typeof window !== 'undefined' && window.storage) 
  ? window.storage 
  : new LocalStorageAdapter();

// Función para verificar si estamos usando el storage real
export const isUsingRealStorage = () => {
  return typeof window !== 'undefined' && !!window.storage;
};

console.log(isUsingRealStorage() 
  ? '✅ Using window.storage (production)' 
  : '🔧 Using localStorage adapter (development)'
);