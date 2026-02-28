import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { QueueManagementService } from './service/queue-management.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UpdateDelayDto } from './dto/update-delay.dto.js';
import { ParseProcessorNamePipe } from 'core/pipes/processor-name.pipe';

@Controller('queues')
@UseGuards(JwtAuthGuard)
export class QueueManagementController {
  constructor(
    private readonly queueService: QueueManagementService,
  ) {}

  @Get()
  async listQueues() {
    return this.queueService.getRunMQQueues();
  }

  @Get(':processorName')
  async getQueueDetails(
    @Param('processorName', ParseProcessorNamePipe) processorName: string,
  ) {
    return this.queueService.getQueueDetails(processorName);
  }

  @Post(':processorName/retries/enable')
  @HttpCode(HttpStatus.OK)
  async enableRetries(
    @Param('processorName', ParseProcessorNamePipe) processorName: string,
  ) {
    await this.queueService.enableRetries(processorName);
    return { message: 'Retries enabled', processorName };
  }

  @Post(':processorName/retries/disable')
  @HttpCode(HttpStatus.OK)
  async disableRetries(
    @Param('processorName', ParseProcessorNamePipe) processorName: string,
  ) {
    await this.queueService.disableRetries(processorName);
    return { message: 'Retries disabled', processorName };
  }

  @Post(':processorName/dlq/enable')
  @HttpCode(HttpStatus.OK)
  async enableDLQ(
    @Param('processorName', ParseProcessorNamePipe) processorName: string,
  ) {
    await this.queueService.enableDLQ(processorName);
    return { message: 'DLQ enabled', processorName };
  }

  @Post(':processorName/dlq/disable')
  @HttpCode(HttpStatus.OK)
  async disableDLQ(
    @Param('processorName', ParseProcessorNamePipe) processorName: string,
  ) {
    await this.queueService.disableDLQ(processorName);
    return { message: 'DLQ disabled', processorName };
  }

  @Put(':processorName/delay')
  async updateDelay(
    @Param('processorName', ParseProcessorNamePipe) processorName: string,
    @Body() dto: UpdateDelayDto,
  ) {
    await this.queueService.updateRetryDelay(processorName, dto.delayMs);
    return {
      message: 'Delay updated',
      processorName,
      delayMs: dto.delayMs,
    };
  }

  @Post(':processorName/reprocess')
  @HttpCode(HttpStatus.OK)
  async reprocessDLQ(
    @Param('processorName', ParseProcessorNamePipe) processorName: string,
  ) {
    const shovelName =
      await this.queueService.reprocessDLQ(processorName);
    return { message: 'DLQ reprocessing started', shovelName };
  }

  @Delete(':processorName/dlq/messages')
  async clearDLQ(
    @Param('processorName', ParseProcessorNamePipe) processorName: string,
  ) {
    await this.queueService.clearDLQ(processorName);
    return { message: 'DLQ cleared', processorName };
  }

  @Get(':processorName/retry/messages')
  async getRetryMessages(
    @Param('processorName', ParseProcessorNamePipe) processorName: string,
    @Query('count', new DefaultValuePipe(100), ParseIntPipe) count: number,
  ) {
    const result = await this.queueService.getRetryMessages(
      processorName,
      count,
    );
    return { ...result, processorName };
  }

  @Get(':processorName/dlq/messages')
  async getDLQMessages(
    @Param('processorName', ParseProcessorNamePipe) processorName: string,
    @Query('count', new DefaultValuePipe(100), ParseIntPipe) count: number,
  ) {
    const result = await this.queueService.getDLQMessages(
      processorName,
      count,
    );
    return { ...result, processorName };
  }
}
