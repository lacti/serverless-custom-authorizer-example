import { IRepository } from "../repository";

const escapeRegex = /[^0-9A-Za-z]/g;

interface ICredential {
  id: string;
  password: string;
}

interface ISession {
  id: string;
  expiredMillis: number;
}

const asCredentialKey = (id: string) =>
  `__credential__${id.replace(escapeRegex, "___")}`;

export class Authorizer {
  constructor(private readonly credentialRepository: IRepository) {}

  public async join(id: string, password: string) {
    return this.credentialRepository.set(asCredentialKey(id), {
      id,
      password
    });
  }

  public async login(id: string, password: string, ttl: number) {
    const credential = await this.credentialRepository.get<ICredential>(
      asCredentialKey(id)
    );
    if (!credential || credential.password !== password) {
      return false;
    }
    const sessionId = this.sessionIdGenerator();
    return this.updateSession(sessionId, id, ttl);
  }

  public async logout(sessionId: string) {
    await this.sessionRepository.delete(asSessionKey(sessionId));
    return true;
  }

  public async authenticate(sessionId: string) {
    const session = await this.sessionRepository.get<ISession>(
      asSessionKey(sessionId)
    );
    if (!session) {
      return false;
    }
    if (session.expiredMillis === 0 || session.expiredMillis >= Date.now()) {
      return true;
    }
    await this.sessionRepository.delete(asSessionKey(sessionId));
    return false;
  }

  public async revoke(sessionId: string, ttl: number) {
    const session = await this.sessionRepository.get<ISession>(
      asSessionKey(sessionId)
    );
    if (!session) {
      return false;
    }
    return this.updateSession(sessionId, session.id, ttl);
  }

  private async updateSession(sessionId: string, id: string, ttl: number) {
    await this.sessionRepository.set(asSessionKey(sessionId), {
      id,
      expiredMillis: ttl > 0 ? Date.now() + ttl : 0
    });
    return true;
  }
}

const randomString = (length: number = 64) => {
  let result = "";
  while (result.length < length) {
    result += Math.floor(Math.random() * 0xffff).toString(16);
  }
  return result.substring(0, length);
};
