import { FMSStep, FMSTemplate, FMSDetail, Project, ProjectTask, Log, User } from '../types';

// Use proxy in development, direct URL in production
const API_URL = import.meta.env.DEV 
  ? '/api' 
  : (import.meta.env.VITE_APPS_SCRIPT_URL as string);

if (!API_URL) {
  throw new Error('VITE_APPS_SCRIPT_URL is not defined. Restart dev server after updating .env');
}

async function callAppsScript(action: string, payload: Record<string, any> = {}, retries = 2) {
  const body = JSON.stringify({ action, ...payload });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      let json;
      let text = '';
      try {
        text = await res.text();
        // Remove BOM and any non-JSON prefix/suffix
        const cleanText = text.replace(/^\uFEFF/, '').trim();
        // First try to parse the cleaned text directly
        try {
          json = JSON.parse(cleanText);
        } catch (parseError) {
          // If direct parse fails, try to extract JSON if wrapped in other content
          const jsonMatch = cleanText.match(/\{.*\}/s);
          const jsonText = jsonMatch ? jsonMatch[0] : cleanText;
          json = JSON.parse(jsonText);
        }
      } catch (e) {
        if (attempt === retries) {
          // Check if it's an HTML error page (Google Apps Script error)
          if (text.includes('<!DOCTYPE html>') || text.includes('TypeError:')) {
            throw new Error(`Google Apps Script Error: ${text.match(/TypeError:.*?(?=\n|$)/)?.[0] || 'Unknown error'}`);
          }
          throw new Error(`Invalid JSON response from server (${res.status}): ${e instanceof Error ? e.message : String(e)}. Response text: ${text.substring(0, 200)}...`);
        }
        continue; // Retry
      }

      if (!res.ok || json?.success === false) {
        const msg = json?.message || json?.error || `API error (${res.status})`;
        throw new Error(msg);
      }

      return json;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

export const api = {
  // expects Apps Script action 'login' -> returns user/session info
  async login(username: string, password: string) {
    // avoid logging sensitive data in production
    return callAppsScript('login', { username, password });
  },

  // Users (frontend expects getAllUsers / createUser(...) signatures)
  async getUsers() {
    return callAppsScript('getUsers');
  },

  async getAllUsers() {
    // alias for getUsers for components that call getAllUsers()
    return this.getUsers();
  },

  async createUser(...args: any[]) {
    // Usage patterns in workspace:
    // 1) api.createUser(userRecord)
    // 2) api.createUser(username, password, name, role, department)
    if (args.length === 1 && typeof args[0] === 'object') {
      return callAppsScript('createUser', args[0]);
    } else {
      const [username, password, name, role, department] = args;
      return callAppsScript('createUser', { username, password, name, role, department });
    }
  },

  // expects Apps Script action 'updateUser'
  async updateUser(id: string | number, updates: Record<string, any>) {
    return callAppsScript('updateUser', { id, ...updates });
  },

  // expects Apps Script action 'deleteUser'
  async deleteUser(id: string | number) {
    return callAppsScript('deleteUser', { id });
  },

  // Departments: frontend calls getAllDepartments — derive from users if backend doesn't have dedicated endpoint
  async getAllDepartments() {
    try {
      const res = await this.getUsers();
      const users = res.users || [];
      const depts = Array.from(new Set(users.map((u: any) => u.department).filter(Boolean)));
      return { success: true, departments: depts };
    } catch (err) {
      // Fallback: return empty list instead of throwing so pages don't crash
      return { success: true, departments: [] };
    }
  },

  // FMS / Projects / Logs
  async createFMS(fmsName: string, steps: FMSStep[], username: string) {
    return callAppsScript('createFMS', { fmsName, steps, username });
  },

  async getAllFMS() {
    return callAppsScript('getAllFMS');
  },

  async getFMSById(fmsId: string) {
    return callAppsScript('getFMSById', { fmsId });
  },

  async createProject(fmsId: string, projectName: string, projectStartDate: string, username: string) {
    return callAppsScript('createProject', { fmsId, projectName, projectStartDate, username });
  },

  async getAllProjects() {
    return callAppsScript('getAllProjects');
  },

  async getProjectsByUser(username: string) {
    return callAppsScript('getProjectsByUser', { username });
  },

  async updateTaskStatus(rowIndex: number, status: string, username: string) {
    return callAppsScript('updateTaskStatus', { rowIndex, status, username });
  },

  async getAllLogs() {
    return callAppsScript('getAllLogs');
  },

  // Backward-compat aliases (some files call these names)
  async getLogs() {
    return this.getAllLogs();
  },
};

export default api;
