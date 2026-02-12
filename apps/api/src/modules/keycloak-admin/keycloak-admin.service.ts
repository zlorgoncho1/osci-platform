import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);
  private readonly baseUrl: string;
  private readonly realm: string;
  private readonly adminUser: string;
  private readonly adminPassword: string;
  private readonly enabled: boolean;

  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>('KEYCLOAK_ADMIN_URL') || '';
    this.realm = this.configService.get<string>('KEYCLOAK_REALM') || 'osci';
    this.adminUser = this.configService.get<string>('KEYCLOAK_ADMIN_USER') || '';
    this.adminPassword = this.configService.get<string>('KEYCLOAK_ADMIN_PASSWORD') || '';
    this.enabled = !!(this.baseUrl && this.adminUser && this.adminPassword);

    if (!this.enabled) {
      this.logger.warn(
        'Keycloak Admin API is not configured (missing KEYCLOAK_ADMIN_URL / KEYCLOAK_ADMIN_USER / KEYCLOAK_ADMIN_PASSWORD). Keycloak sync disabled.',
      );
    }
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  private async ensureToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt - 10_000) {
      return this.cachedToken;
    }

    const url = `${this.baseUrl}/realms/master/protocol/openid-connect/token`;
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: this.adminUser,
      password: this.adminPassword,
    });

    const { data } = await firstValueFrom(
      this.httpService.post(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );

    this.cachedToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return this.cachedToken!;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await this.ensureToken();
    return { Authorization: `Bearer ${token}` };
  }

  private get adminUrl(): string {
    return `${this.baseUrl}/admin/realms/${this.realm}`;
  }

  async createUser(
    email: string,
    firstName: string | null,
    lastName: string | null,
    tempPassword?: string,
  ): Promise<string> {
    const headers = await this.authHeaders();

    const body: any = {
      username: email,
      email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      enabled: true,
      emailVerified: false,
    };

    if (tempPassword) {
      body.credentials = [
        {
          type: 'password',
          value: tempPassword,
          temporary: true,
        },
      ];
    }

    const response = await firstValueFrom(
      this.httpService.post(`${this.adminUrl}/users`, body, { headers }),
    );

    // Extract keycloakId from Location header
    const location = response.headers['location'] || '';
    const keycloakId = location.split('/').pop() || '';
    return keycloakId;
  }

  async updateUser(
    keycloakId: string,
    data: { email?: string; firstName?: string; lastName?: string; enabled?: boolean },
  ): Promise<void> {
    const headers = await this.authHeaders();
    const body: any = {};
    if (data.email !== undefined) {
      body.email = data.email;
      body.username = data.email;
    }
    if (data.firstName !== undefined) body.firstName = data.firstName;
    if (data.lastName !== undefined) body.lastName = data.lastName;
    if (data.enabled !== undefined) body.enabled = data.enabled;

    await firstValueFrom(
      this.httpService.put(`${this.adminUrl}/users/${keycloakId}`, body, { headers }),
    );
  }

  async deleteUser(keycloakId: string): Promise<void> {
    const headers = await this.authHeaders();
    await firstValueFrom(
      this.httpService.delete(`${this.adminUrl}/users/${keycloakId}`, { headers }),
    );
  }

  async resetPassword(
    keycloakId: string,
    tempPassword: string,
    temporary = true,
  ): Promise<void> {
    const headers = await this.authHeaders();
    await firstValueFrom(
      this.httpService.put(
        `${this.adminUrl}/users/${keycloakId}/reset-password`,
        { type: 'password', value: tempPassword, temporary },
        { headers },
      ),
    );
  }

  async setEnabled(keycloakId: string, enabled: boolean): Promise<void> {
    await this.updateUser(keycloakId, { enabled });
  }

  async setRequiredActions(
    keycloakId: string,
    actions: string[],
  ): Promise<void> {
    const headers = await this.authHeaders();
    await firstValueFrom(
      this.httpService.put(
        `${this.adminUrl}/users/${keycloakId}`,
        { requiredActions: actions },
        { headers },
      ),
    );
  }

  async sendVerifyEmail(keycloakId: string): Promise<void> {
    const headers = await this.authHeaders();
    await firstValueFrom(
      this.httpService.put(
        `${this.adminUrl}/users/${keycloakId}/send-verify-email`,
        {},
        { headers },
      ),
    );
  }

  async listUsers(search?: string): Promise<any[]> {
    const headers = await this.authHeaders();
    const params: any = { max: 100 };
    if (search) params.search = search;

    const { data } = await firstValueFrom(
      this.httpService.get(`${this.adminUrl}/users`, { headers, params }),
    );
    return data;
  }
}
