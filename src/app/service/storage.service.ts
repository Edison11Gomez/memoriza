import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Storage } from '@ionic/storage-angular';

export interface PartidaHistorial {
  date: string;
  atems: number;
  win: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private ionicStorage: Storage | null = null;

  constructor(private storage: Storage) { }

  async init(): Promise<void> {
    const storage = await this.storage.create();
    this.ionicStorage = storage;
  }

  async getBestAtems(): Promise<number> {
    const { value } = await Preferences.get({ key: 'bestAtems' });
    return value ? Number(value) : 0;
  }

  async saveAtems(atems: number): Promise<boolean> {
    const current = await this.getBestAtems();
    const isRecord = current === 0 || atems < current;

    if (isRecord) {
      await Preferences.set({ key: 'bestAtems', value: atems.toString() });
    }

    return isRecord;
  }

  async saveHistory(entry: PartidaHistorial): Promise<void> {
    const history: PartidaHistorial[] = (await this.ionicStorage?.get('history')) || [];
    history.push(entry);
    await this.ionicStorage?.set('history', history);
  }

  async getHistory(): Promise<PartidaHistorial[]> {
    const history: PartidaHistorial[] = (await this.ionicStorage?.get('history')) || [];
    return history;
  }
}