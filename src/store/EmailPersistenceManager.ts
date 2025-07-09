// EmailPersistenceManager.ts
// Handles email status persistence and custom column management for the email store

import { Email, EmailColumn } from "@/lib/types/email";
import { getSelectedLinkedEmailId, getSelectedLinkedEmailType } from "@/lib/utils/cookies";

export interface EmailPersistenceState {
  [accountKey: string]: {
    emailStatuses: { [emailId: string]: string };
    customColumns: EmailColumn[];
    lastUpdated: number;
  };
}

export class EmailPersistenceManager {
  private static STORAGE_KEY = 'email_persistence_data';
  private static COLUMNS_STORAGE_KEY = 'emailColumnsData';
  
  // Get unique account key for current selected email
  private static getAccountKey(): string | null {
    const emailId = getSelectedLinkedEmailId();
    const emailType = getSelectedLinkedEmailType();
    
    if (!emailId) return null;
    
    return `${emailId}_${emailType || 'default'}`;
  }

  // Load persistence data from localStorage
  private static loadPersistenceData(): EmailPersistenceState {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading persistence data:', error);
      return {};
    }
  }

  // Save persistence data to localStorage
  private static savePersistenceData(data: EmailPersistenceState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving persistence data:', error);
    }
  }

  // Save email status for current account
  static saveEmailStatus(emailId: string, status: string): void {
    const accountKey = this.getAccountKey();
    if (!accountKey) {
      console.warn('Cannot save email status: No account selected');
      return;
    }

    const data = this.loadPersistenceData();
    
    if (!data[accountKey]) {
      data[accountKey] = {
        emailStatuses: {},
        customColumns: [],
        lastUpdated: Date.now()
      };
    }

    data[accountKey].emailStatuses[emailId] = status;
    data[accountKey].lastUpdated = Date.now();
    
    this.savePersistenceData(data);
    console.log(`Saved email ${emailId} status as ${status} for account ${accountKey}`);
  }

  // Get saved email status for current account
  static getSavedEmailStatus(emailId: string): string | null {
    const accountKey = this.getAccountKey();
    if (!accountKey) return null;

    const data = this.loadPersistenceData();
    return data[accountKey]?.emailStatuses[emailId] || null;
  }

  // Apply saved statuses to emails array
  static applyPersistedStatuses(emails: Email[]): Email[] {
    const accountKey = this.getAccountKey();
    if (!accountKey) return emails;

    const data = this.loadPersistenceData();
    const accountData = data[accountKey];
    
    if (!accountData || !accountData.emailStatuses) return emails;

    return emails.map(email => {
      const savedStatus = accountData.emailStatuses[email.id];
      if (savedStatus && savedStatus !== email.status) {
        console.log(`Applying persisted status for email ${email.id}: ${email.status} -> ${savedStatus}`);
        return {
          ...email,
          status: savedStatus,
          category: savedStatus as any
        };
      }
      return email;
    });
  }

  // Save custom columns for current account
  static saveCustomColumns(columns: EmailColumn[]): void {
    const accountKey = this.getAccountKey();
    if (!accountKey) {
      console.warn('Cannot save custom columns: No account selected');
      return;
    }

    // Save global columns (backward compatibility)
    try {
      localStorage.setItem(this.COLUMNS_STORAGE_KEY, JSON.stringify(columns));
    } catch (error) {
      console.error('Error saving global columns:', error);
    }

    // Save account-specific columns
    const data = this.loadPersistenceData();
    
    if (!data[accountKey]) {
      data[accountKey] = {
        emailStatuses: {},
        customColumns: [],
        lastUpdated: Date.now()
      };
    }

    data[accountKey].customColumns = columns;
    data[accountKey].lastUpdated = Date.now();
    
    this.savePersistenceData(data);
    console.log(`Saved ${columns.length} custom columns for account ${accountKey}`);
  }

  // Load custom columns for current account
  static loadCustomColumns(): EmailColumn[] {
    const accountKey = this.getAccountKey();
    
    // Default columns that should always exist
    const defaultColumns: EmailColumn[] = [
      { id: "inbox", title: "Inbox", icon: "📧", gradient: "from-blue-500 to-cyan-500" },
      { id: "urgent", title: "Urgent", icon: "🚨", gradient: "from-red-500 to-orange-500" },
      { id: "follow-up", title: "Follow-Up", icon: "📁", gradient: "from-gray-500 to-slate-500" }
    ];

    if (!accountKey) {
      // No account selected, return default columns
      return defaultColumns;
    }

    const data = this.loadPersistenceData();
    const accountData = data[accountKey];
    
    if (accountData && accountData.customColumns && accountData.customColumns.length > 0) {
      // Ensure default columns are always present and merge with custom columns
      const savedColumns = accountData.customColumns;
      const mergedColumns = [...defaultColumns];
      
      // Add any custom columns that aren't default columns
      savedColumns.forEach(col => {
        if (!defaultColumns.find(defaultCol => defaultCol.id === col.id)) {
          mergedColumns.push(col);
        }
      });
      
      console.log(`Loaded ${mergedColumns.length} columns for account ${accountKey}`);
      return mergedColumns;
    }

    // Fallback to global columns for backward compatibility
    try {
      const globalColumns = localStorage.getItem(this.COLUMNS_STORAGE_KEY);
      if (globalColumns) {
        const parsedColumns = JSON.parse(globalColumns);
        // Migrate any old "archive" column to "follow-up"
        const migratedColumns = parsedColumns.map((column: EmailColumn) => {
          if (column.id === "archive") {
            return {
              ...column,
              id: "follow-up",
              title: "Follow-Up"
            };
          }
          return column;
        });
        
        // Save to account-specific storage
        this.saveCustomColumns(migratedColumns);
        return migratedColumns;
      }
    } catch (error) {
      console.error('Error loading global columns:', error);
    }

    // Return default columns if nothing else works
    return defaultColumns;
  }

  // Remove email status (when email is deleted)
  static removeEmailStatus(emailId: string): void {
    const accountKey = this.getAccountKey();
    if (!accountKey) return;

    const data = this.loadPersistenceData();
    if (data[accountKey] && data[accountKey].emailStatuses) {
      delete data[accountKey].emailStatuses[emailId];
      data[accountKey].lastUpdated = Date.now();
      this.savePersistenceData(data);
      console.log(`Removed persisted status for email ${emailId}`);
    }
  }

  // Clear all data for current account (useful for account switching)
  static clearAccountData(): void {
    const accountKey = this.getAccountKey();
    if (!accountKey) return;

    const data = this.loadPersistenceData();
    delete data[accountKey];
    this.savePersistenceData(data);
    console.log(`Cleared all data for account ${accountKey}`);
  }

  // Get debug info
  static getDebugInfo(): any {
    const accountKey = this.getAccountKey();
    const data = this.loadPersistenceData();
    
    return {
      currentAccount: accountKey,
      allAccounts: Object.keys(data),
      currentAccountData: accountKey ? data[accountKey] : null,
      totalStoredEmails: accountKey ? Object.keys(data[accountKey]?.emailStatuses || {}).length : 0
    };
  }

  // Clean up old data (optional maintenance function)
  static cleanupOldData(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): void { // 30 days default
    const data = this.loadPersistenceData();
    const now = Date.now();
    let cleaned = false;

    Object.keys(data).forEach(accountKey => {
      const accountData = data[accountKey];
      if (accountData.lastUpdated && (now - accountData.lastUpdated) > maxAgeMs) {
        delete data[accountKey];
        cleaned = true;
        console.log(`Cleaned up old data for account ${accountKey}`);
      }
    });

    if (cleaned) {
      this.savePersistenceData(data);
    }
  }
}