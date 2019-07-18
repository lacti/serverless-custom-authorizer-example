import {
  APIGatewayProxyHandler,
  CustomAuthorizerHandler,
  AuthResponse
} from "aws-lambda";
import "source-map-support/register";
import * as jwt from "jsonwebtoken";

const jwtSecret = "verySecret";

const splitByDelimiter = (data: string, delim: string) => {
  const pos = data.indexOf(delim);
  return pos > 0 ? [data.substr(0, pos), data.substr(pos + 1)] : ["", ""];
};

const login = (authData: string) => {
  const [id, pw] = splitByDelimiter(authData, ":");
  console.log(`login`, id, pw);
  console.log(`login id`, `lacti=[${id}]`, "lacti" === id);
  console.log(`login id`, `1234=[${pw}]`, "1234" === pw);
  if (id !== "lacti" || pw !== "1234") {
    throw new Error("Unauthorized");
  }
  const token = jwt.sign({ id }, jwtSecret, { expiresIn: "30m" });
  console.log(`token`, token);
  return token;
};

const verify = (authData: string) => {
  console.log(`authorize`, authData);
  const decoded = jwt.verify(authData, jwtSecret);
  console.log(`decoded`, decoded);
  return decoded;
};

const authorize = (token: string): { success: boolean; token?: string } => {
  console.log(`auth-token`, token);
  if (!token) {
    throw new Error("Unauthorized");
  }

  const [prefix, authData] = splitByDelimiter(token, " ");
  console.log(`prefix-data`, prefix, authData);
  switch (prefix) {
    case "Basic":
      token = login(
        Buffer.from(authData, "base64")
          .toString("utf8")
          .trim()
      );
      return { success: !!token, token };
    case "Bearer":
      if (verify(authData)) {
        return { success: true };
      }
  }
  throw new Error("Unauthorized");
};

export const auth: CustomAuthorizerHandler = async event => {
  console.log(event);
  console.log(JSON.stringify(event));
  try {
    const result = authorize(event.authorizationToken);
    return {
      principalId: "user",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: result.success ? "Allow" : "Deny",
            Resource: event.methodArn
          }
        ]
      },
      context: {
        token: result.token
      }
    } as AuthResponse;
  } catch (error) {
    console.error(error);
    throw new Error("Unauthorized");
  }
};

export const hello: APIGatewayProxyHandler = async event => {
  console.log(JSON.stringify(event, null, 2));
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    },
    body: JSON.stringify(event.requestContext.authorizer)
  };
};
