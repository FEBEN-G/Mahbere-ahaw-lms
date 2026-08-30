import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { configureProgramPolicy } from '../../common/utils/program-policy';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';

const DEFAULTS = {
  dripDaysPerMonth: 30,
  publishedCoursesPerMonth: 2,
  maxUploadMb: 10,
};

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const settings = await this.ensureSettings();
    this.applyPolicy(settings);
  }

  async getSettings() {
    return this.ensureSettings();
  }

  async updateSettings(dto: UpdateSystemSettingsDto, updatedById: string) {
    const current = await this.ensureSettings();
    const settings = await this.prisma.systemSettings.update({
      where: { id: current.id },
      data: {
        dripDaysPerMonth: dto.dripDaysPerMonth,
        publishedCoursesPerMonth: dto.publishedCoursesPerMonth,
        maxUploadMb: dto.maxUploadMb,
        updatedById,
      },
    });
    this.applyPolicy(settings);
    return settings;
  }

  private async ensureSettings() {
    const existing = await this.prisma.systemSettings.findFirst();
    if (existing) {
      return existing;
    }

    this.logger.warn('No system settings row found; creating defaults');
    return this.prisma.systemSettings.create({ data: DEFAULTS });
  }

  private applyPolicy(settings: {
    dripDaysPerMonth: number;
    publishedCoursesPerMonth: number;
    maxUploadMb: number;
  }) {
    configureProgramPolicy({
      dripDaysPerMonth: settings.dripDaysPerMonth,
      publishedCoursesPerMonth: settings.publishedCoursesPerMonth,
      maxUploadMb: settings.maxUploadMb,
    });
  }
}
