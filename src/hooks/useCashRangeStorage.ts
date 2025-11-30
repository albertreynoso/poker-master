import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { CashRange, SequenceType, CashPosition } from '@/types/cashGame';

// ============================================================================
// STORAGE ADAPTER (localStorage como fallback)
// ============================================================================

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

// Usar window.storage si está disponible, sino localStorage
const storageAdapter = typeof window !== 'undefined' && (window as any).storage
  ? (window as any).storage
  : new LocalStorageAdapter();

// Log para debugging
if (typeof window !== 'undefined') {
  console.log(
    (window as any).storage
      ? '✅ Using window.storage (production)'
      : '🔧 Using localStorage adapter (development)'
  );
}

// ============================================================================
// TIPOS
// ============================================================================

type StorageKey = {
  sequence: SequenceType;
  positions: Record<string, CashPosition>;
};

type RangeIndex = {
  keys: string[];
  lastUpdated: string;
};

// ============================================================================
// CONSTANTES
// ============================================================================

const STORAGE_PREFIX = 'cash-range';
const INDEX_KEY = 'cash-range-index';
const OLD_STORAGE_KEY = 'poker-cash-ranges';

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Genera una clave única para una configuración específica
 */
function generateStorageKey(config: StorageKey): string {
  const sortedPositions = Object.entries(config.positions)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  
  return `${STORAGE_PREFIX}:${config.sequence}:${sortedPositions}`;
}

/**
 * Genera un nombre descriptivo para una configuración
 */
export function generateRangeName(config: StorageKey): string {
  const sequenceNames: Record<SequenceType, string> = {
    'OPEN_RAISE': 'OR',
    'RAISE_OVER_LIMP': 'ROL',
    '3BET': '3B',
    'SQUEEZE': 'SQZ',
    'COLD_4BET': 'C4B'
  };
  
  const positionParts = Object.entries(config.positions)
    .map(([, value]) => value)
    .join('-');
  
  return `${sequenceNames[config.sequence]} ${positionParts}`;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useCashRangeStorage() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  
  // ✅ FIX 1: Usar ref para evitar re-inicializaciones
  const hasInitialized = useRef(false);

  /**
   * Obtiene el índice de rangos guardados
   */
  const getIndex = useCallback(async (): Promise<RangeIndex> => {
    try {
      const result = await storageAdapter.get(INDEX_KEY);
      if (result && result.value) {
        return JSON.parse(result.value);
      }
    } catch (error) {
      console.log('Index not found, creating new one');
    }
    return { keys: [], lastUpdated: new Date().toISOString() };
  }, []);

  /**
   * Actualiza el índice de rangos
   */
  const updateIndex = useCallback(async (keys: string[]) => {
    const index: RangeIndex = {
      keys,
      lastUpdated: new Date().toISOString()
    };
    await storageAdapter.set(INDEX_KEY, JSON.stringify(index));
  }, []);

  /**
   * Migra datos del localStorage al nuevo sistema
   */
  const migrateFromLocalStorage = useCallback(async () => {
    // ✅ FIX 2: Verificar si ya se inicializó
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    setIsMigrating(true);
    try {
      const oldData = localStorage.getItem(OLD_STORAGE_KEY);
      if (!oldData) {
        setIsInitialized(true);
        setIsMigrating(false);
        return;
      }

      const oldRanges: CashRange[] = JSON.parse(oldData);
      const migratedKeys: string[] = [];

      for (const range of oldRanges) {
        const storageKey = generateStorageKey({
          sequence: range.sequence,
          positions: range.positions
        });

        try {
          await storageAdapter.set(storageKey, JSON.stringify(range));
          migratedKeys.push(storageKey);
        } catch (error) {
          console.error(`Failed to migrate range ${range.name}:`, error);
        }
      }

      await updateIndex(migratedKeys);
      localStorage.removeItem(OLD_STORAGE_KEY);

      toast.success(`${oldRanges.length} ranges migrated successfully`);
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error('Failed to migrate ranges');
    } finally {
      setIsInitialized(true);
      setIsMigrating(false);
    }
  }, [updateIndex]);

  /**
   * Guarda un rango para una configuración específica
   */
  const saveRange = useCallback(async (
    config: StorageKey,
    range: Omit<CashRange, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    try {
      const storageKey = generateStorageKey(config);
      
      let existingRange: CashRange | null = null;
      try {
        const result = await storageAdapter.get(storageKey);
        if (result && result.value) {
          existingRange = JSON.parse(result.value);
        }
      } catch {
        // No existe, continuar
      }

      const now = new Date().toISOString();
      const fullRange: CashRange = {
        ...range,
        id: existingRange?.id || Date.now().toString(),
        createdAt: existingRange?.createdAt || now,
        updatedAt: now
      };

      await storageAdapter.set(storageKey, JSON.stringify(fullRange));

      // ✅ FIX 3: Solo actualizar índice si es nuevo
      if (!existingRange) {
        const index = await getIndex();
        if (!index.keys.includes(storageKey)) {
          await updateIndex([...index.keys, storageKey]);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to save range:', error);
      return false;
    }
  }, [getIndex, updateIndex]);

  /**
   * Carga un rango para una configuración específica
   */
  const loadRange = useCallback(async (config: StorageKey): Promise<CashRange | null> => {
    try {
      const storageKey = generateStorageKey(config);
      const result = await storageAdapter.get(storageKey);
      
      if (result && result.value) {
        return JSON.parse(result.value);
      }
      return null;
    } catch (error) {
      // No hay rango guardado para esta configuración
      return null;
    }
  }, []);

  /**
   * Lista todos los rangos guardados
   */
  const listAllRanges = useCallback(async (): Promise<CashRange[]> => {
    try {
      const index = await getIndex();
      const ranges: CashRange[] = [];

      for (const key of index.keys) {
        try {
          const result = await storageAdapter.get(key);
          if (result && result.value) {
            ranges.push(JSON.parse(result.value));
          }
        } catch (error) {
          console.error(`Failed to load range ${key}:`, error);
        }
      }

      return ranges.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('Failed to list ranges:', error);
      return [];
    }
  }, [getIndex]);

  /**
   * Elimina un rango específico
   */
  const deleteRange = useCallback(async (config: StorageKey): Promise<boolean> => {
    try {
      const storageKey = generateStorageKey(config);
      await storageAdapter.delete(storageKey);

      const index = await getIndex();
      const updatedKeys = index.keys.filter(k => k !== storageKey);
      await updateIndex(updatedKeys);

      return true;
    } catch (error) {
      console.error('Failed to delete range:', error);
      return false;
    }
  }, [getIndex, updateIndex]);

  /**
   * Exporta todos los rangos
   */
  const exportAllRanges = useCallback(async (): Promise<string> => {
    const ranges = await listAllRanges();
    return JSON.stringify(ranges, null, 2);
  }, [listAllRanges]);

  /**
   * Importa rangos desde JSON
   */
  const importRanges = useCallback(async (jsonData: string): Promise<number> => {
    try {
      const ranges: CashRange[] = JSON.parse(jsonData);
      let imported = 0;

      for (const range of ranges) {
        const success = await saveRange(
          { sequence: range.sequence, positions: range.positions },
          range
        );
        if (success) imported++;
      }

      return imported;
    } catch (error) {
      console.error('Failed to import ranges:', error);
      throw error;
    }
  }, [saveRange]);

  // ✅ FIX 4: Inicialización sin dependencias que causen loops
  useEffect(() => {
    if (!hasInitialized.current) {
      migrateFromLocalStorage();
    }
  }, []); // ⚠️ Array vacío porque usamos ref

  return {
    isInitialized,
    isMigrating,
    saveRange,
    loadRange,
    listAllRanges,
    deleteRange,
    exportAllRanges,
    importRanges
  };
}