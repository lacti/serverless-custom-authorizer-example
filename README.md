# Hello Custom Authorizer

This is a simple example for [Custom Authorizer of AWS API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html).

[![Custom auth workflow](https://docs.aws.amazon.com/apigateway/latest/developerguide/images/custom-auth-workflow.png)](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)

- This image from [apigateway-use-lambda-authorizer.html](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html).

Please see a detail example about `Custom authorizer` of `Serverless framework` in [here](https://serverless.com/framework/docs/providers/aws/events/apigateway/#http-endpoints-with-custom-authorizers).

## Workflow

1. Do basic authentication with `login API`.
2. `login API` validates a credential that is hardcoded. And generate and return a JWT.
3. When `hello API` is called, `auth` function will be called before `hello` handler.
4. `auth` function validates a JWT in a request and generate the allow or deny policy document.
5. If allowed, `hello` handler is invoked and it responses proper value, that is, an event object in this example.

Please see details in [handler.ts](handler.ts).

## Walkthrough

1. Set your AWS profile and give it to proper permissions to deploy this stack.
2. `sls deploy`
3. `curl -XPOST "https://test:1234@API-ID.execute-api.REGION.amazonaws.com/dev/login"` and get a token from the response.
4. `curl -XGET -H "Authorization: Bearer TOKEN-FROM-RESPONSE" "https://API-ID.execute-id.REGION.amazonaws.com/dev/hello"`.

```bash
$ sls deploy
...
endpoints:
  POST - https://API-ID.execute-api.REGION.amazonaws.com/dev/login
  GET - https://API-ID.execute-api.REGION.amazonaws.com/dev/hello1
  GET - https://API-ID.execute-api.REGION.amazonaws.com/dev/hello2
  GET - https://API-ID.execute-api.REGION.amazonaws.com/dev/hello3
functions:
  login: hello-custom-authorizer-dev-login
  auth: hello-custom-authorizer-dev-auth
  hello1: hello-custom-authorizer-dev-hello1
  hello2: hello-custom-authorizer-dev-hello2
  hello3: hello-custom-authorizer-dev-hello3
...

$ curl -XPOST "https://test:1234@API-ID.execute-api.REGION.amazonaws.com/dev/login"
{"token":"TOKEN-FROM-RESPONSE"}

$ curl -XGET -H "Authorization: Bearer TOKEN-FROM-RESPONSE" "https://API-ID.execute-id.REGION.amazonaws.com/dev/hello1"
{"hello":"1",{"resource":"/hello","path":"/hello","httpMethod":"GET","headers":{"Accept":"*/*","Authorization":"Bearer TOKEN-FROM-RESPONSE",...},...}}

$ curl -v -XGET "https://API-ID.execute-id.REGION.amazonaws.com/dev/hello1"
...
< HTTP/2 401
< content-type: application/json
< content-length: 26
...
{"message":"Unauthorized"}
```

It has three `hello API` to see a cached policy can accept multiple functions by [the `methodArn` with `*` scope](handler.ts#L50). So we can see these functions are executed without `auth` function call because a policy was cached when called it first time.

```bash
$ curl -XGET -H "Authorization: Bearer TOKEN-FROM-RESPONSE" "https://API-ID.execute-id.REGION.amazonaws.com/dev/hello2"
{"hello":"2",{"resource":"/hello","path":"/hello","httpMethod":"GET","headers":{"Accept":"*/*","Authorization":"Bearer TOKEN-FROM-RESPONSE",...},...}}

$ curl -XGET -H "Authorization: Bearer TOKEN-FROM-RESPONSE" "https://API-ID.execute-id.REGION.amazonaws.com/dev/hello3"
{"hello":"3",{"resource":"/hello","path":"/hello","httpMethod":"GET","headers":{"Accept":"*/*","Authorization":"Bearer TOKEN-FROM-RESPONSE",...},...}}
```
