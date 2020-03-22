import {sign, verify} from "jsonwebtoken";

const secret = "1jfh3kf";
const sso_secret = "dsdda1jfh3kf";

export const generateSSOToken: (appId: number, personnelId: number) => Promise<[string | null, Error | null]> = (appId: number, personnelId: number) => {
  return new Promise((resolve) => {
    // 一天有效
    sign({appId, personnelId}, sso_secret, {expiresIn: '1d'}, (err: Error | null, token: string) => {
      if (err) {
        resolve([null, err]);
        return;
      }
      resolve([token, null]);
    });
  });
};
export const verifySSOToken: (token: string) => Promise<[{appId: number, personnelId: number} | null, Error | null]> = (token: string) => {
  return new Promise((resolve) => {
    verify(token, sso_secret, (err, decoded) => {
      if (err) {
        resolve([null, err]);
        return;
      }
      resolve([decoded as any, null]);
    });
  });
};


export const generateToken: (id: number) => Promise<[string | null, Error | null]> = (id: number) => {
  return new Promise((resolve) => {
    // 一天有效
    sign({id}, secret, {expiresIn: '1d'}, (err: Error | null, token: string) => {
      if (err) {
        resolve([null, err]);
        return;
      }
      resolve([token, null]);
    });
  });
};
export const verifyToken: (token: string) => Promise<[{id: number} | null, Error | null]> = (token: string) => {
  return new Promise((resolve) => {
    verify(token, secret, (err, decoded) => {
      if (err) {
        resolve([null, err]);
        return;
      }
      resolve([decoded as any, null]);
    });
  });
};
