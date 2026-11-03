/**
 * HUSEN HISAB - IndexedDB Storage Layer with LocalStorage Safety Mirror
 * Database: HusenHisabDB
 */

const DB_NAME = 'HusenHisabDB';
const DB_VERSION = 1;

class HisabDB {
  constructor() {
    this.db = null;
    this.isReady = false;
    this.readyPromise = this.init();
  }

  async init() {
    if (typeof indexedDB === 'undefined') {
      console.warn('IndexedDB not supported; using LocalStorage fallback.');
      this.isReady = true;
      return null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('work_records')) {
          const workStore = db.createObjectStore('work_records', { keyPath: 'id', autoIncrement: true });
          workStore.createIndex('date', 'date', { unique: false });
          workStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('payment_records')) {
          const paymentStore = db.createObjectStore('payment_records', { keyPath: 'id', autoIncrement: true });
          paymentStore.createIndex('date', 'date', { unique: false });
          paymentStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isReady = true;
        this.syncFromLocalStorageIfEmpty();
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error, falling back to LocalStorage:', event.target.error);
        this.isReady = true;
        resolve(null);
      };
    });
  }

  // --- Work Records CRUD ---

  async addWorkRecord(record) {
    await this.readyPromise;
    record.createdAt = record.createdAt || new Date().toISOString();
    record.updatedAt = new Date().toISOString();

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('work_records', 'readwrite');
        const store = tx.objectStore('work_records');
        const request = store.add(record);

        request.onsuccess = (e) => {
          record.id = e.target.result;
          this.mirrorToLocalStorage();
          resolve(record);
        };
        request.onerror = (e) => reject(e.target.error);
      });
    } else {
      const records = this.getLocalStorageItem('work_records') || [];
      record.id = Date.now();
      records.push(record);
      this.setLocalStorageItem('work_records', records);
      return record;
    }
  }

  async updateWorkRecord(record) {
    await this.readyPromise;
    record.updatedAt = new Date().toISOString();

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('work_records', 'readwrite');
        const store = tx.objectStore('work_records');
        const request = store.put(record);

        request.onsuccess = () => {
          this.mirrorToLocalStorage();
          resolve(record);
        };
        request.onerror = (e) => reject(e.target.error);
      });
    } else {
      let records = this.getLocalStorageItem('work_records') || [];
      const index = records.findIndex(r => r.id === record.id);
      if (index !== -1) {
        records[index] = record;
      }
      this.setLocalStorageItem('work_records', records);
      return record;
    }
  }

  async deleteWorkRecord(id) {
    await this.readyPromise;
    const numId = Number(id);

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('work_records', 'readwrite');
        const store = tx.objectStore('work_records');
        const request = store.delete(numId);

        request.onsuccess = () => {
          this.mirrorToLocalStorage();
          resolve(true);
        };
        request.onerror = (e) => reject(e.target.error);
      });
    } else {
      let records = this.getLocalStorageItem('work_records') || [];
      records = records.filter(r => r.id !== numId && r.id !== id);
      this.setLocalStorageItem('work_records', records);
      return true;
    }
  }

  async getAllWorkRecords() {
    await this.readyPromise;

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('work_records', 'readonly');
        const store = tx.objectStore('work_records');
        const request = store.getAll();

        request.onsuccess = (e) => {
          const list = e.target.result || [];
          // Sort by date descending, then id descending
          list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id - a.id));
          resolve(list);
        };
        request.onerror = (e) => reject(e.target.error);
      });
    } else {
      const records = this.getLocalStorageItem('work_records') || [];
      records.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id - a.id));
      return records;
    }
  }

  async getWorkRecord(id) {
    await this.readyPromise;
    const numId = Number(id);

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('work_records', 'readonly');
        const store = tx.objectStore('work_records');
        const request = store.get(numId);

        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    } else {
      const records = this.getLocalStorageItem('work_records') || [];
      return records.find(r => r.id === numId || r.id === id) || null;
    }
  }

  // --- Payment Records CRUD ---

  async addPaymentRecord(record) {
    await this.readyPromise;
    record.createdAt = record.createdAt || new Date().toISOString();
    record.updatedAt = new Date().toISOString();

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('payment_records', 'readwrite');
        const store = tx.objectStore('payment_records');
        const request = store.add(record);

        request.onsuccess = (e) => {
          record.id = e.target.result;
          this.mirrorToLocalStorage();
          resolve(record);
        };
        request.onerror = (e) => reject(e.target.error);
      });
    } else {
      const records = this.getLocalStorageItem('payment_records') || [];
      record.id = Date.now();
      records.push(record);
      this.setLocalStorageItem('payment_records', records);
      return record;
    }
  }

  async updatePaymentRecord(record) {
    await this.readyPromise;
    record.updatedAt = new Date().toISOString();

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('payment_records', 'readwrite');
        const store = tx.objectStore('payment_records');
        const request = store.put(record);

        request.onsuccess = () => {
          this.mirrorToLocalStorage();
          resolve(record);
        };
        request.onerror = (e) => reject(e.target.error);
      });
    } else {
      let records = this.getLocalStorageItem('payment_records') || [];
      const index = records.findIndex(r => r.id === record.id);
      if (index !== -1) {
        records[index] = record;
      }
      this.setLocalStorageItem('payment_records', records);
      return record;
    }
  }

  async deletePaymentRecord(id) {
    await this.readyPromise;
    const numId = Number(id);

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('payment_records', 'readwrite');
        const store = tx.objectStore('payment_records');
        const request = store.delete(numId);

        request.onsuccess = () => {
          this.mirrorToLocalStorage();
          resolve(true);
        };
        request.onerror = (e) => reject(e.target.error);
      });
    } else {
      let records = this.getLocalStorageItem('payment_records') || [];
      records = records.filter(r => r.id !== numId && r.id !== id);
      this.setLocalStorageItem('payment_records', records);
      return true;
    }
  }

  async getAllPaymentRecords() {
    await this.readyPromise;

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('payment_records', 'readonly');
        const store = tx.objectStore('payment_records');
        const request = store.getAll();

        request.onsuccess = (e) => {
          const list = e.target.result || [];
          list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id - a.id));
          resolve(list);
        };
        request.onerror = (e) => reject(e.target.error);
      });
    } else {
      const records = this.getLocalStorageItem('payment_records') || [];
      records.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id - a.id));
      return records;
    }
  }

  // --- LocalStorage Mirror & Sync ---

  getLocalStorageItem(key) {
    try {
      const data = localStorage.getItem('hh_' + key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('LocalStorage read error:', e);
      return null;
    }
  }

  setLocalStorageItem(key, val) {
    try {
      localStorage.setItem('hh_' + key, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage write error:', e);
    }
  }

  async mirrorToLocalStorage() {
    try {
      if (!this.db) return;
      const works = await this.getAllWorkRecords();
      const payments = await this.getAllPaymentRecords();
      this.setLocalStorageItem('work_records', works);
      this.setLocalStorageItem('payment_records', payments);
    } catch (e) {
      console.warn('Error mirroring to localStorage:', e);
    }
  }

  async syncFromLocalStorageIfEmpty() {
    try {
      if (!this.db) return;
      const countWorks = await new Promise(res => {
        const tx = this.db.transaction('work_records', 'readonly');
        const req = tx.objectStore('work_records').count();
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(0);
      });

      if (countWorks === 0) {
        const lsWorks = this.getLocalStorageItem('work_records');
        if (lsWorks && lsWorks.length > 0) {
          const tx = this.db.transaction('work_records', 'readwrite');
          const store = tx.objectStore('work_records');
          lsWorks.forEach(w => store.put(w));
        }
      }

      const countPayments = await new Promise(res => {
        const tx = this.db.transaction('payment_records', 'readonly');
        const req = tx.objectStore('payment_records').count();
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(0);
      });

      if (countPayments === 0) {
        const lsPayments = this.getLocalStorageItem('payment_records');
        if (lsPayments && lsPayments.length > 0) {
          const tx = this.db.transaction('payment_records', 'readwrite');
          const store = tx.objectStore('payment_records');
          lsPayments.forEach(p => store.put(p));
        }
      }
    } catch (e) {
      console.warn('Error syncing from LocalStorage fallback:', e);
    }
  }

  // --- Backup, Export & Clear ---

  async exportFullBackup() {
    const works = await this.getAllWorkRecords();
    const payments = await this.getAllPaymentRecords();

    return {
      appName: 'HUSEN HISAB',
      factory: 'SHREEJI CEMENT PRODUCT',
      version: 1,
      exportedAt: new Date().toISOString(),
      workRecordsCount: works.length,
      paymentRecordsCount: payments.length,
      data: {
        workRecords: works,
        paymentRecords: payments
      }
    };
  }

  async importFullBackup(backupData) {
    if (!backupData || !backupData.data) {
      throw new Error('અમાન્ય બેકઅપ ફાઇલ (Invalid backup format)');
    }

    const { workRecords = [], paymentRecords = [] } = backupData.data;

    await this.clearAllData();

    if (this.db) {
      if (workRecords.length > 0) {
        await new Promise((resolve, reject) => {
          const tx = this.db.transaction('work_records', 'readwrite');
          const store = tx.objectStore('work_records');
          workRecords.forEach(r => store.put(r));
          tx.oncomplete = () => resolve();
          tx.onerror = (e) => reject(e.target.error);
        });
      }

      if (paymentRecords.length > 0) {
        await new Promise((resolve, reject) => {
          const tx = this.db.transaction('payment_records', 'readwrite');
          const store = tx.objectStore('payment_records');
          paymentRecords.forEach(r => store.put(r));
          tx.oncomplete = () => resolve();
          tx.onerror = (e) => reject(e.target.error);
        });
      }
    } else {
      this.setLocalStorageItem('work_records', workRecords);
      this.setLocalStorageItem('payment_records', paymentRecords);
    }

    await this.mirrorToLocalStorage();
    return {
      importedWorks: workRecords.length,
      importedPayments: paymentRecords.length
    };
  }

  async clearAllData() {
    await this.readyPromise;

    if (this.db) {
      await new Promise((resolve, reject) => {
        const tx = this.db.transaction(['work_records', 'payment_records'], 'readwrite');
        tx.objectStore('work_records').clear();
        tx.objectStore('payment_records').clear();
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
      });
    }

    try {
      localStorage.removeItem('hh_work_records');
      localStorage.removeItem('hh_payment_records');
    } catch (e) {
      console.warn('Error clearing localStorage:', e);
    }

    return true;
  }
}

// Global instance
const hisabDB = new HisabDB();
