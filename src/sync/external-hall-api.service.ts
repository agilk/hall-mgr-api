import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface ExternalHall {
  id: number;
  uid: string;
  name: string;
  address: string;
  placeLimit: number;
  regionId: number;
  isActive: number;
  rooms: ExternalRoom[];
}

export interface ExternalRoom {
  id: number;
  name: string;
  capacity: number;
  examHallId: number;
  isActive: number;
}

export interface ParticipantTimeSlot {
  startTime: string;
  participants: ParticipantRoomData[];
}

export interface ParticipantRoomData {
  hallId: number;
  hallName: string;
  roomId: number;
  roomName: string;
  participantCount: number;
}

@Injectable()
export class ExternalHallApiService {
  private readonly logger = new Logger(ExternalHallApiService.name);
  private readonly baseUrl: string;
  private readonly authToken: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>('EXTERNAL_HALL_API_URL');
    this.authToken = this.configService.get<string>('EXTERNAL_HALL_API_TOKEN');
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get all exam halls with rooms
   * GET /api/external-app/exam-halls
   */
  async getExamHalls(): Promise<ExternalHall[]> {
    try {
      this.logger.log('Fetching exam halls from external API');

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/external-app/exam-halls`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.log(`Fetched ${response.data.data.length} exam halls`);
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to fetch exam halls', error.stack);
      throw new Error(`External API error: ${error.message}`);
    }
  }

  /**
   * Get rooms by hall ID
   * GET /api/external-app/hall-rooms/:hallId
   */
  async getHallRooms(hallId: number): Promise<ExternalRoom[]> {
    try {
      this.logger.log(`Fetching rooms for hall ${hallId}`);

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/api/external-app/hall-rooms/${hallId}`,
          {
            headers: this.getHeaders(),
          },
        ),
      );

      return response.data.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch rooms for hall ${hallId}`,
        error.stack,
      );
      throw new Error(`External API error: ${error.message}`);
    }
  }

  /**
   * Get room participants by exam date
   * GET /api/external-app/room-participants/:examDate
   */
  async getRoomParticipants(examDate: string): Promise<ParticipantTimeSlot[]> {
    try {
      this.logger.log(`Fetching participants for date ${examDate}`);

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/api/external-app/room-participants/${examDate}`,
          {
            headers: this.getHeaders(),
          },
        ),
      );

      return response.data.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch participants for ${examDate}`,
        error.stack,
      );
      throw new Error(`External API error: ${error.message}`);
    }
  }
}
