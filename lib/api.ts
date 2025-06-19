import { create, StateCreator } from "zustand";
import {
  persist,
  createJSONStorage,
  PersistOptions,
  StateStorage,
} from "zustand/middleware";

type ConnectionState = {
  url: string;
  apiKey: string;
  isConnected: boolean;
  setConnection: (url: string, apiKey: string) => Promise<void>;
  resetConnection: () => void;
  saveBookmark: (
    title: string,
    label: string,
    pageUrl: string,
    content: string
  ) => Promise<void>;
};

type ConnectionPersist = (
  config: StateCreator<ConnectionState>,
  options: PersistOptions<ConnectionState>
) => StateCreator<ConnectionState>;

const chromeStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return new Promise((resolve) => {
      chrome.storage.local.get([name], (result) => {
        resolve(result[name] || null);
      });
    });
  },
  setItem: async (name: string, value: string): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [name]: value }, () => {
        resolve();
      });
    });
  },
  removeItem: async (name: string): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.remove(name, () => {
        resolve();
      });
    });
  },
};

export const useConnection = create<ConnectionState>(
  (persist as ConnectionPersist)(
    (set, get) => ({
      url: "",
      apiKey: "",
      isConnected: false,
      setConnection: async (url: string, apiKey: string) => {
        try {
          const response = await fetch(`${url}/ext/connect`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
          });
          if (!response.ok) {
            throw new Error("Connection failed");
          }
          const resp = await response.json();
          if (resp.code !== 0) {
            throw new Error(resp.msg);
          }
          set({ url, apiKey, isConnected: true });
        } catch (error) {
          console.error("Connection error:", error);
          throw error;
        }
      },
      resetConnection: () => {
        set({ url: "", apiKey: "", isConnected: false });
      },
      saveBookmark: async (
        title: string,
        label: string,
        pageUrl: string,
        content: string
      ) => {
        const { url, apiKey } = get();
        const labels = label
          .split(",")
          .map((l) => l.trim())
          .filter((l) => l);
        const data = {
          title,
          labels,
          url: pageUrl,
          content,
        };
        try {
          const response = await fetch(`${url}/ext/bookmark`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error(response.statusText);
          }
          const resp = await response.json();
          if (resp.code === 61) {
            throw new Error("Unauthorized");
          }
          if (resp.code !== 0) {
            throw new Error(resp.msg);
          }
        } catch (error) {
          console.error("Save bookmark error:", error);
          throw error;
        }
      },
    }),
    {
      name: "connection-storage",
      version: 1,
      storage: createJSONStorage(() => chromeStorage),
    }
  )
);
