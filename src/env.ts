import dotenv from "dotenv";
import Path from "path";
import * as assert from "assert";

dotenv.config({path: Path.join(__dirname, '../.env')});
const {NODE_ENV, SERVER_PUBLIC_BASE, SERVER_LISTEN_PORT, SERVER_JWT_SECRET, MYSQL_HOST, MYSQL_PORT, MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_DATABASE} = process.env;

const env: {[s: string]: any} = {
  NODE_ENV,
  SERVER_PUBLIC_BASE,
  SERVER_LISTEN_PORT,
  SERVER_JWT_SECRET,
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USERNAME,
  MYSQL_PASSWORD,
  MYSQL_DATABASE
};
Object.keys(env).forEach(key => {
  assert.notStrictEqual(env[key], undefined, key + " undefined");
});
console.info('Got env: ', JSON.stringify(env, null, 2));

export default env;
export const siteBaseUrl = SERVER_PUBLIC_BASE;
export const siteStaticBaseUrl = `${siteBaseUrl}/static`;
