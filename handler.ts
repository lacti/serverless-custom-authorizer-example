import { APIGatewayProxyHandler, CustomAuthorizerHandler } from "aws-lambda";
import "source-map-support/register";
import * as jwt from "jsonwebtoken";

const jwtSecret = "verySecret";
const admin = {
  id: "test",
  password: "1234"
};

const splitByDelimiter = (data: string, delim: string) => {
  const pos = data ? data.indexOf(delim) : -1;
  return pos > 0 ? [data.substr(0, pos), data.substr(pos + 1)] : ["", ""];
};

const decodeBase64 = (input: string) =>
  Buffer.from(input, "base64").toString("utf8");

export const login: APIGatewayProxyHandler = async event => {
  // https://tools.ietf.org/html/rfc7617
  // Authorization: Basic BASE64("id:password")
  const [type, data] = splitByDelimiter(event.headers["Authorization"], " ");
  const [id, pw] = splitByDelimiter(decodeBase64(data), ":");

  // Accept only if all of type, id and password are expected value.
  const accepted = type === "Basic" && id === admin.id && pw === admin.password;
  if (!accepted) {
    return {
      statusCode: 401,
      body: "Unauthorized"
    };
  }
  // Generate a JWT to verify it at "auth" function easily.
  const token = jwt.sign({ id }, jwtSecret, { expiresIn: "30m" });
  return {
    statusCode: 200,
    body: JSON.stringify({ token })
  };
};

export const auth: CustomAuthorizerHandler = async event => {
  // https://tools.ietf.org/html/rfc6750
  // Authorization: Bearer b64token
  const [type, token] = splitByDelimiter(event.authorizationToken, " ");

  // Create the appropriate policy based on the validity of the token.
  const allow = type === "Bearer" && !!jwt.verify(token, jwtSecret);

  // arn:aws:execute-api:REGION:ACCOUNT_ID:API_ID/STAGE/METHOD/FUNCTION_NAME
  const [, , , region, accountId, apiId, stage] = event.methodArn.split(/[:/]/);
  const scopedMethodArn =
    ["arn", "aws", "execute-api", region, accountId, apiId].join(":") +
    "/" +
    [stage, /* method= */ "*", /* function= */ "*"].join("/");
  return {
    principalId: "user",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: allow ? "Allow" : "Deny",
          Resource: scopedMethodArn
        }
      ]
    }
  };
};

export const hello1: APIGatewayProxyHandler = async event => {
  return {
    statusCode: 200,
    body: JSON.stringify({ hello: "1", event })
  };
};

export const hello2: APIGatewayProxyHandler = async event => {
  return {
    statusCode: 200,
    body: JSON.stringify({ hello: "2", event })
  };
};

export const hello3: APIGatewayProxyHandler = async event => {
  return {
    statusCode: 200,
    body: JSON.stringify({ hello: "3", event })
  };
};
