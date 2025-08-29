import { DocumentManager } from '../types';

const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3001/api";

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Log della richiesta per debug
      if (process.env.NODE_ENV === "development") {
        console.log(`API Request: ${config.method || "GET"} ${url}`);
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Se non riesce a parsare JSON, usa il messaggio di default
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ API Error (${endpoint}):`, error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Impossibile connettersi al server. Assicurati che il backend sia in esecuzione su porta 3001."
        );
      }
      throw error;
    }
  }

  // Clienti API
  async getClienti() {
    return this.request("/clienti");
  }

  async getCliente(id: number) {
    return this.request(`/clienti/${id}`);
  }

  async createCliente(cliente: any) {
    return this.request("/clienti", {
      method: "POST",
      body: JSON.stringify(cliente),
    });
  }

  async updateCliente(id: number, cliente: any) {
    return this.request(`/clienti/${id}`, {
      method: "PUT",
      body: JSON.stringify(cliente),
    });
  }

  async deleteCliente(id: number) {
    return this.request(`/clienti/${id}`, {
      method: "DELETE",
    });
  }

  // Software API
  async getSoftware() {
    return this.request("/software");
  }

  async getSoftwareById(id: number) {
    return this.request(`/software/${id}`);
  }

  async createSoftware(software: any) {
    return this.request("/software", {
      method: "POST",
      body: JSON.stringify(software),
    });
  }

  async updateSoftware(id: number, software: any) {
    return this.request(`/software/${id}`, {
      method: "PUT",
      body: JSON.stringify(software),
    });
  }

  async deleteSoftware(id: number) {
    return this.request(`/software/${id}`, {
      method: "DELETE",
    });
  }

  // Licenze API
  async getLicenze() {
    return this.request("/licenze");
  }

  async getLicenza(id: number) {
    return this.request(`/licenze/${id}`);
  }

  async createLicenza(licenza: any) {
    return this.request("/licenze", {
      method: "POST",
      body: JSON.stringify(licenza),
    });
  }

  async updateLicenza(id: number, licenza: any) {
    return this.request(`/licenze/${id}`, {
      method: "PUT",
      body: JSON.stringify(licenza),
    });
  }

  async deleteLicenza(id: number) {
    return this.request(`/licenze/${id}`, {
      method: "DELETE",
    });
  }

  async getLicenzeStats() {
    return this.request("/licenze/stats");
  }

  async updateLicenzeStates() {
    return this.request("/licenze/update-states", {
      method: "POST",
    });
  }

  // Aggiungi questi metodi alla classe ApiService

    // Document Manager API
    async getDocuments(): Promise<DocumentManager[]> {
      return this.request("/documentManager");
  }

  async getDocument(id: number): Promise<DocumentManager> {
      return this.request(`/documentManager/${id}`);
  }

  async createDocument(document: Omit<DocumentManager, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentManager> {
      return this.request("/documentManager", {
          method: "POST",
          body: JSON.stringify(document),
      });
  }

  async updateDocument(id: number, document: Partial<DocumentManager>): Promise<DocumentManager> {
      return this.request(`/documentManager/${id}`, {
          method: "PUT",
          body: JSON.stringify(document),
      });
  }

  async deleteDocument(id: number): Promise<void> {
      await this.request(`/documentManager/${id}`, {
          method: "DELETE",
      });
  }

  async getDocumentsByCliente(clienteId: number): Promise<DocumentManager[]> {
      return this.request(`/documentManager/cliente/${clienteId}`);
  }
}

export const apiService = new ApiService();
