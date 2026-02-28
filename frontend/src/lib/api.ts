import { QueueSummary, QueueDetails, DLQMessage } from '@/types/queue';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiMessage {
  message: string;
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        statusCode: response.status,
        message: response.statusText,
      }));
      throw error;
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string) {
    return this.request<{ accessToken: string; user: { id: string; username: string; role: string } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    );
  }

  async getCurrentUser() {
    return this.request<{ id: string; username: string; role: string }>('/auth/me');
  }

  // Queues
  async getQueues() {
    return this.request<QueueSummary[]>('/queues');
  }

  async getQueueDetails(processorName: string) {
    return this.request<QueueDetails>(`/queues/${encodeURIComponent(processorName)}`);
  }

  async enableRetries(processorName: string) {
    return this.request<ApiMessage & { processorName: string }>(
      `/queues/${encodeURIComponent(processorName)}/retries/enable`,
      { method: 'POST' }
    );
  }

  async disableRetries(processorName: string) {
    return this.request<ApiMessage & { processorName: string }>(
      `/queues/${encodeURIComponent(processorName)}/retries/disable`,
      { method: 'POST' }
    );
  }

  async enableDlq(processorName: string) {
    return this.request<ApiMessage & { processorName: string }>(
      `/queues/${encodeURIComponent(processorName)}/dlq/enable`,
      { method: 'POST' }
    );
  }

  async disableDlq(processorName: string) {
    return this.request<ApiMessage & { processorName: string }>(
      `/queues/${encodeURIComponent(processorName)}/dlq/disable`,
      { method: 'POST' }
    );
  }

  async updateRetryDelay(processorName: string, delayMs: number) {
    return this.request<ApiMessage & { processorName: string; delayMs: number }>(
      `/queues/${encodeURIComponent(processorName)}/delay`,
      {
        method: 'PUT',
        body: JSON.stringify({ delayMs }),
      }
    );
  }

  async reprocessDlq(processorName: string) {
    return this.request<ApiMessage & { shovelName: string }>(
      `/queues/${encodeURIComponent(processorName)}/reprocess`,
      { method: 'POST' }
    );
  }

  // DLQ Messages
  async clearDlq(processorName: string) {
    return this.request<ApiMessage & { processorName: string }>(
      `/queues/${encodeURIComponent(processorName)}/dlq/messages`,
      { method: 'DELETE' }
    );
  }

  async getDlqMessages(processorName: string, count: number = 100) {
    return this.request<{ messages: DLQMessage[]; totalInQueue: number; processorName: string }>(
      `/queues/${encodeURIComponent(processorName)}/dlq/messages?count=${count}`
    );
  }

  async getRetryMessages(processorName: string, count: number = 100) {
    return this.request<{ messages: DLQMessage[]; totalInQueue: number; processorName: string }>(
      `/queues/${encodeURIComponent(processorName)}/retry/messages?count=${count}`
    );
  }

  // Health
  async getHealth() {
    return this.request<{ status: string; timestamp: string; rabbitmq: { connected: boolean } }>('/health');
  }
}

export const api = new ApiClient();
