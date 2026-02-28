import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { RabbitMQQueue } from './interfaces/queue.interface.js';
import { RabbitMQBinding } from './interfaces/binding.interface.js';
import { RabbitMQPolicy } from './interfaces/policy.interface.js';
import {
  RabbitMQShovel,
  RabbitMQShovelConfig,
} from './interfaces/shovel.interface.js';
import { RabbitMQExchange } from './interfaces/exchange.interface.js';
import { RabbitMQMessage } from './interfaces/message.interface.js';
import { AppConfig } from '../configs';

@Injectable()
export class RabbitMQManagementClient {
  private readonly logger = new Logger(RabbitMQManagementClient.name);
  private readonly client: AxiosInstance;
  private readonly vhost: string;

  constructor(private readonly configService: ConfigService<AppConfig>) {
    const host = this.configService.get('rabbitmq.host', { infer: true })!;
    const port = this.configService.get('rabbitmq.port', { infer: true })!;
    const username = this.configService.get('rabbitmq.managementUser', {
      infer: true,
    })!;
    const password = this.configService.get('rabbitmq.managementPassword', {
      infer: true,
    })!;
    this.vhost = this.configService.get('rabbitmq.vhost', { infer: true })!;

    const baseURL = `http://${host}:${port}/api`;

    this.client = axios.create({
      baseURL,
      auth: { username, password },
      headers: { 'Content-Type': 'application/json' },
      timeout: 30_000,
    });

    this.logger.log(
      `RabbitMQ Management API client initialized: ${baseURL}`,
    );
  }

  private encodeVhost(vhost: string = this.vhost): string {
    return encodeURIComponent(vhost);
  }

  async getQueues(): Promise<RabbitMQQueue[]> {
    const response = await this.client.get<RabbitMQQueue[]>(
      `/queues/${this.encodeVhost()}`,
    );
    return response.data;
  }

  async getQueue(queueName: string): Promise<RabbitMQQueue> {
    const response = await this.client.get<RabbitMQQueue>(
      `/queues/${this.encodeVhost()}/${encodeURIComponent(queueName)}`,
    );
    return response.data;
  }

  async getQueueBindings(queueName: string): Promise<RabbitMQBinding[]> {
    const response = await this.client.get<RabbitMQBinding[]>(
      `/queues/${this.encodeVhost()}/${encodeURIComponent(queueName)}/bindings`,
    );
    return response.data;
  }

  async createBinding(
    exchangeName: string,
    queueName: string,
    routingKey: string,
    arguments_?: Record<string, any>,
  ): Promise<void> {
    const v = this.encodeVhost();
    const e = encodeURIComponent(exchangeName);
    const q = encodeURIComponent(queueName);

    await this.client.post(`/bindings/${v}/e/${e}/q/${q}`, {
      routing_key: routingKey,
      arguments: arguments_ || {},
    });

    this.logger.log(
      `Created binding: ${exchangeName} -> ${queueName} (key: ${routingKey})`,
    );
  }

  async deleteBinding(
    exchangeName: string,
    queueName: string,
    propertiesKey: string,
  ): Promise<void> {
    const v = this.encodeVhost();
    const e = encodeURIComponent(exchangeName);
    const q = encodeURIComponent(queueName);
    const p = encodeURIComponent(propertiesKey);

    await this.client.delete(`/bindings/${v}/e/${e}/q/${q}/${p}`);

    this.logger.log(
      `Deleted binding: ${exchangeName} -> ${queueName} (props: ${propertiesKey})`,
    );
  }

  async getPolicies(): Promise<RabbitMQPolicy[]> {
    const response = await this.client.get<RabbitMQPolicy[]>(
      `/policies/${this.encodeVhost()}`,
    );
    return response.data;
  }

  async getPolicy(policyName: string): Promise<RabbitMQPolicy | null> {
    try {
      const response = await this.client.get<RabbitMQPolicy>(
        `/policies/${this.encodeVhost()}/${encodeURIComponent(policyName)}`,
      );
      this.logger.debug(`Retrieved policy: ${policyName}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async putPolicy(
    policyName: string,
    pattern: string,
    definition: Record<string, any>,
    applyTo: 'queues' | 'exchanges' | 'all' = 'queues',
    priority: number = 0,
  ): Promise<void> {
    await this.client.put(
      `/policies/${this.encodeVhost()}/${encodeURIComponent(policyName)}`,
      {
        pattern,
        definition,
        'apply-to': applyTo,
        priority,
      },
    );

    this.logger.log(`Created/Updated policy: ${policyName}`);
  }

  async deletePolicy(policyName: string): Promise<void> {
    await this.client.delete(
      `/policies/${this.encodeVhost()}/${encodeURIComponent(policyName)}`,
    );
    this.logger.log(`Deleted policy: ${policyName}`);
  }

  async getOperatorPolicy(policyName: string): Promise<RabbitMQPolicy | null> {
    try {
      const response = await this.client.get<RabbitMQPolicy>(
        `/operator-policies/${this.encodeVhost()}/${encodeURIComponent(policyName)}`,
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async putOperatorPolicy(
    policyName: string,
    pattern: string,
    definition: Record<string, any>,
    applyTo: 'queues' | 'exchanges' | 'all' = 'queues',
    priority: number = 0,
  ): Promise<void> {
    await this.client.put(
      `/operator-policies/${this.encodeVhost()}/${encodeURIComponent(policyName)}`,
      {
        pattern,
        definition,
        'apply-to': applyTo,
        priority,
      },
    );

    this.logger.log(`Created/Updated operator policy: ${policyName}`);
  }

  async getExchanges(): Promise<RabbitMQExchange[]> {
    const response = await this.client.get<RabbitMQExchange[]>(
      `/exchanges/${this.encodeVhost()}`,
    );
    return response.data;
  }

  async getAllBindings(): Promise<RabbitMQBinding[]> {
    const response = await this.client.get<RabbitMQBinding[]>(
      `/bindings/${this.encodeVhost()}`,
    );
    return response.data;
  }

  async createShovel(
    shovelName: string,
    config: RabbitMQShovelConfig,
  ): Promise<void> {
    await this.client.put(
      `/parameters/shovel/${this.encodeVhost()}/${encodeURIComponent(shovelName)}`,
      config,
    );
    this.logger.log(`Created shovel: ${shovelName}`);
  }

  async getShovel(shovelName: string): Promise<RabbitMQShovel | null> {
    try {
      const response = await this.client.get<RabbitMQShovel>(
        `/parameters/shovel/${this.encodeVhost()}/${encodeURIComponent(shovelName)}`,
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getGlobalParameter<T>(name: string): Promise<T | null> {
    try {
      const response = await this.client.get(
        `/global-parameters/${encodeURIComponent(name)}`,
      );
      return response.data.value as T;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async setGlobalParameter<T>(name: string, value: T): Promise<void> {
    await this.client.put(
      `/global-parameters/${encodeURIComponent(name)}`,
      { value },
    );
    this.logger.log(`Set global parameter: ${name}`);
  }

  async purgeQueue(queueName: string): Promise<void> {
    await this.client.delete(
      `/queues/${this.encodeVhost()}/${encodeURIComponent(queueName)}/contents`,
    );
    this.logger.log(`Purged queue: ${queueName}`);
  }

  async getMessages(
    queueName: string,
    count: number = 100,
    truncate: number = 50000,
  ): Promise<RabbitMQMessage[]> {
    const response = await this.client.post<RabbitMQMessage[]>(
      `/queues/${this.encodeVhost()}/${encodeURIComponent(queueName)}/get`,
      {
        count,
        ackmode: 'ack_requeue_true',
        encoding: 'auto',
        truncate,
      },
    );
    return response.data;
  }

  async isShovelPluginEnabled(): Promise<boolean> {
    try {
      await this.client.get('/parameters/shovel');
      return true;
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/overview');
      return true;
    } catch (error) {
      this.logger.error(
        'RabbitMQ Management API health check failed',
        error,
      );
      return false;
    }
  }
}
