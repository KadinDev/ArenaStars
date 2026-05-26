import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const memory = new Map<string, string>();

function canUseLocalStorage() {
  return Platform.OS === "web" && typeof window !== "undefined" && Boolean(window.localStorage);
}

async function safeCall<T>(callback: () => Promise<T>, fallback: () => T) {
  try {
    return await callback();
  } catch {
    return fallback();
  }
}

export const safeAsyncStorage = {
  getItem(key: string) {
    return safeCall(
      () => AsyncStorage.getItem(key),
      () => {
        if (canUseLocalStorage()) return window.localStorage.getItem(key);
        return memory.get(key) ?? null;
      }
    );
  },
  setItem(key: string, value: string) {
    return safeCall(
      () => AsyncStorage.setItem(key, value),
      () => {
        if (canUseLocalStorage()) window.localStorage.setItem(key, value);
        else memory.set(key, value);
      }
    );
  },
  removeItem(key: string) {
    return safeCall(
      () => AsyncStorage.removeItem(key),
      () => {
        if (canUseLocalStorage()) window.localStorage.removeItem(key);
        else memory.delete(key);
      }
    );
  },
  getAllKeys() {
    return safeCall(
      () => AsyncStorage.getAllKeys(),
      () => {
        if (canUseLocalStorage()) return Object.keys(window.localStorage);
        return Array.from(memory.keys());
      }
    );
  }
};
