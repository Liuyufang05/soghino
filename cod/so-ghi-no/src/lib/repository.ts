import type { AppData, LocalAccount } from "../types";
import { loadData, saveData } from "./storage";
export interface DataRepository {
  load(account: LocalAccount): AppData;
  save(accountId: string, data: AppData): void;
}
export const localStorageRepository: DataRepository = {
  load: (account) => loadData(account),
  save: (accountId, data) => saveData(accountId, data),
};
// Replace this adapter with a Supabase-backed implementation when project credentials are available.

