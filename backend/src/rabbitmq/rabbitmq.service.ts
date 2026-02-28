import { Injectable } from '@nestjs/common';
import { RabbitMQManagementClient } from './rabbitmq-management.client.js';
import { RabbitMQQueue } from './interfaces/queue.interface.js';
import { RabbitMQShovelConfig } from './interfaces/shovel.interface.js';
import { Constants } from '../constants.js';

@Injectable()
export class RabbitMQService {
  constructor(
    private readonly managementClient: RabbitMQManagementClient,
  ) {}

  /**
   * Get all queues managed by RunMQ framework
   * (identified by dead letter exchange = _runmq_dead_letter_router)
   */
  async getRunMQQueues(): Promise<RabbitMQQueue[]> {
    const allQueues = await this.managementClient.getQueues();
    return allQueues.filter(
      (queue) =>
        queue.arguments?.['x-dead-letter-exchange'] ===
        Constants.DEAD_LETTER_ROUTER_EXCHANGE_NAME,
    );
  }

  /**
   * Check if retries are enabled for a processor
   * by checking if the retry delay queue is bound to the DLR exchange
   */
  async areRetriesEnabled(processorName: string): Promise<boolean> {
    const retryQueueName = `${Constants.RETRY_DELAY_QUEUE_PREFIX}${processorName}`;
    const bindings =
      await this.managementClient.getQueueBindings(retryQueueName);

    return bindings.some(
      (binding) =>
        binding.source === Constants.DEAD_LETTER_ROUTER_EXCHANGE_NAME &&
        binding.routing_key === processorName,
    );
  }

  /**
   * Check if DLQ is enabled for a processor
   */
  async isDLQEnabled(processorName: string): Promise<boolean> {
    const dlqName = `${Constants.DLQ_QUEUE_PREFIX}${processorName}`;
    const bindings = await this.managementClient.getQueueBindings(dlqName);

    return bindings.some(
      (binding) =>
        binding.source === Constants.DEAD_LETTER_ROUTER_EXCHANGE_NAME &&
        binding.routing_key === `${Constants.DLQ_QUEUE_PREFIX}${processorName}`,
    );
  }

  /**
   * Get the delay (TTL) for a processor from its policy
   */
  async getDelayForProcessor(
    processorName: string,
  ): Promise<number | null> {
    const policyName = `${Constants.MESSAGE_TTL_OPERATOR_POLICY_PREFIX}${Constants.RETRY_DELAY_QUEUE_PREFIX}${processorName}`;
    const policy = await this.managementClient.getOperatorPolicy(policyName);
    return policy?.definition?.['message-ttl'] || null;
  }

  // Forward all management client methods
  getQueues() {
    return this.managementClient.getQueues();
  }

  getQueue(queueName: string) {
    return this.managementClient.getQueue(queueName);
  }

  getQueueBindings(queueName: string) {
    return this.managementClient.getQueueBindings(queueName);
  }

  createBinding(
    exchangeName: string,
    queueName: string,
    routingKey: string,
    args?: Record<string, any>,
  ) {
    return this.managementClient.createBinding(
      exchangeName,
      queueName,
      routingKey,
      args,
    );
  }

  deleteBinding(
    exchangeName: string,
    queueName: string,
    propertiesKey: string,
  ) {
    return this.managementClient.deleteBinding(
      exchangeName,
      queueName,
      propertiesKey,
    );
  }

  getPolicies() {
    return this.managementClient.getPolicies();
  }

  getPolicy(policyName: string) {
    return this.managementClient.getPolicy(policyName);
  }

  putPolicy(
    policyName: string,
    pattern: string,
    definition: Record<string, any>,
    applyTo?: 'queues' | 'exchanges' | 'all',
    priority?: number,
  ) {
    return this.managementClient.putPolicy(
      policyName,
      pattern,
      definition,
      applyTo,
      priority,
    );
  }

  deletePolicy(policyName: string) {
    return this.managementClient.deletePolicy(policyName);
  }

  getOperatorPolicy(policyName: string) {
    return this.managementClient.getOperatorPolicy(policyName);
  }

  putOperatorPolicy(
    policyName: string,
    pattern: string,
    definition: Record<string, any>,
    applyTo?: 'queues' | 'exchanges' | 'all',
    priority?: number,
  ) {
    return this.managementClient.putOperatorPolicy(
      policyName,
      pattern,
      definition,
      applyTo,
      priority,
    );
  }

  createShovel(shovelName: string, config: RabbitMQShovelConfig) {
    return this.managementClient.createShovel(shovelName, config);
  }

  getGlobalParameter<T>(name: string) {
    return this.managementClient.getGlobalParameter<T>(name);
  }

  setGlobalParameter<T>(name: string, value: T) {
    return this.managementClient.setGlobalParameter(name, value);
  }

  purgeQueue(queueName: string) {
    return this.managementClient.purgeQueue(queueName);
  }

  getMessages(queueName: string, count?: number, truncate?: number) {
    return this.managementClient.getMessages(queueName, count, truncate);
  }

  isShovelPluginEnabled() {
    return this.managementClient.isShovelPluginEnabled();
  }

  healthCheck() {
    return this.managementClient.healthCheck();
  }
}
