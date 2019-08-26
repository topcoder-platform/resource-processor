# Topcoder Challenge Resources Processor

## Dependencies

- nodejs https://nodejs.org/en/ (v10+)
- Kafka

## Configuration

Configuration for the processor is at `config/default.js` and `config/production.js`.
The following parameters can be set in config files or in env variables:

- DISABLE_LOGGING: whether to disable logging, default is false
- LOG_LEVEL: the log level, default value: 'debug'
- AUTH0_URL: AUTH0 URL, used to get M2M token
- AUTH0_AUDIENCE: AUTH0 audience, used to get M2M token, default value is 'https://www.topcoder-dev.com'
- TOKEN_CACHE_TIME: AUTH0 token cache time, used to get M2M token
- AUTH0_PROXY_SERVER_URL: Auth0 proxy server url, used to get TC M2M token
- AUTH0_CLIENT_ID: AUTH0 client id, used to get M2M token
- AUTH0_CLIENT_SECRET: AUTH0 client secret, used to get M2M token
- KAFKA_URL: comma separated Kafka hosts, default value: 'localhost:9092'
- KAFKA_GROUP_ID: the Kafka group id, default value: 'challenge-resources-processor'
- KAFKA_CLIENT_CERT: Kafka connection certificate, optional, default value is undefined;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to certificate file or certificate content
- KAFKA_CLIENT_CERT_KEY: Kafka connection private key, optional, default value is undefined;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to private key file or private key content
- KAFKA_TOPIC: Kafka topic to listen, default value is 'challenge.notification.create'
- REQUEST_TIMEOUT: superagent request timeout in milliseconds, default value is 20000
- RESOURCE_ROLE_ID: the challenge member resource role id
- GET_PROJECT_API_BASE: get project API base URL, default value is mock API 'http://localhost:4000/v4/projects'
- SEARCH_MEMBERS_API_BASE: search members API base URL, default value is 'https://api.topcoder.com/v3/members/_search'
- CREATE_RESOURCE_API: create resource API URL, default value is mock API 'http://localhost:4000/v5/resources'


Set the following environment variables so that the app can get TC M2M token (use 'set' insted of 'export' for Windows OS):

- export AUTH0_CLIENT_ID=EkE9qU3Ey6hdJwOsF1X0duwskqcDuElW
- export AUTH0_CLIENT_SECRET=Iq7REiEacFmepPh0UpKoOmc6u74WjuoJriLayeVnt311qeKNBvhRNBe9BZ8WABYk
- export AUTH0_URL=https://topcoder-dev.auth0.com/oauth/token
- export AUTH0_AUDIENCE=https://m2m.topcoder-dev.com/
- export TOKEN_CACHE_TIME=90

Also note that there is a `/health` endpoint that checks for the health of the app. This sets up an expressjs server and listens on the environment variable `PORT`. It's not part of the configuration file and needs to be passed as an environment variable


Configuration for the tests is at `config/test.js`, only add such new configurations if different than `config/default.js`:
- WAIT_TIME: wait time used in test, default is 2000 or 2 seconds

## Local Kafka setup

- `http://kafka.apache.org/quickstart` contains details to setup and manage Kafka server,
  below provides details to setup Kafka server in Mac, Windows will use bat commands in bin/windows instead
- download kafka at `https://www.apache.org/dyn/closer.cgi?path=/kafka/1.1.0/kafka_2.11-1.1.0.tgz`
- extract out the doanlowded tgz file
- go to extracted directory kafka_2.11-0.11.0.1
- start ZooKeeper server:
  `bin/zookeeper-server-start.sh config/zookeeper.properties`
- use another terminal, go to same directory, start the Kafka server:
  `bin/kafka-server-start.sh config/server.properties`
- note that the zookeeper server is at localhost:2181, and Kafka server is at localhost:9092
- use another terminal, go to same directory, create topic:
  `bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic challenge.notification.create`
- verify that the topics are created:
  `bin/kafka-topics.sh --list --zookeeper localhost:2181`,
  it should list out the created topic
- run the producer and then write some message into the console to send to the `challenge.notification.create` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic challenge.notification.create`
  in the console, write message, one message per line:
  `{ "topic": "challenge.notification.create", "originator": "challenge-api", "timestamp": "2019-02-16T00:00:00", "mime-type": "application/json", "payload": { "id": "5505f779-b28b-428f-888b-e523b443f3ea", "typeId": "7705f779-b28b-428f-888b-e523b443f3ea", "track": "code", "name": "test", "description": "desc", "timelineTemplateId": "8805f779-b28b-428f-888b-e523b443f3ea", "phases": [{ "id": "8805f779-b28b-428f-888b-e523b443f3eb", "name": "phase", "isActive": true, "duration": 1000 }], "prizeSets": [{ "type": "Challenge prizes", "prizes": [{ "type": "1st", "value": 600 }] }], "reviewType": "community", "tags": ["tag1"], "projectId": 30055214, "startDate": "2019-02-19T00:00:00", "status": "Draft", "created": "2019-02-16T00:00:00", "createdBy": "tester" } }`
- optionally, use another terminal, go to same directory, start a consumer to view the messages:
  `bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic challenge.notification.create --from-beginning`


## Local deployment

- start mock-api, go to `mock-api` folder, run `npm i` and `npm start`, mock api is running at `http://localhost:4000`
- go to project root folder, install dependencies `npm i`
- run code lint check `npm run lint`, running `npm run lint:fix` can fix some lint errors
- start processor app `npm start`


## Unit Tests and E2E Tests

Before running tests, setup and start kafka server, start the mock API, but do not start the processor app.

- run `npm run test` to execute unit tests.
- run `npm run test:cov` to execute unit tests and generate coverage report.
- run `npm run e2e` to execute e2e tests.
- run `npm run e2e:cov` to execute e2e tests and generate coverage report.


## Verification

- setup and start kafka server, start mock API, start processor app
- start kafka-console-producer to write messages to `challenge.notification.create` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic challenge.notification.create`
- write message:
  `{ "topic": "challenge.notification.create", "originator": "challenge-api", "timestamp": "2019-02-16T00:00:00", "mime-type": "application/json", "payload": { "id": "5505f779-b28b-428f-888b-e523b443f3ea", "typeId": "7705f779-b28b-428f-888b-e523b443f3ea", "track": "code", "name": "test", "description": "desc", "timelineTemplateId": "8805f779-b28b-428f-888b-e523b443f3ea", "phases": [{ "id": "8805f779-b28b-428f-888b-e523b443f3eb", "name": "phase", "isActive": true, "duration": 1000 }], "prizeSets": [{ "type": "Challenge prizes", "prizes": [{ "type": "1st", "value": 600 }] }], "reviewType": "community", "tags": ["tag1"], "projectId": 30055214, "startDate": "2019-02-19T00:00:00", "status": "Draft", "created": "2019-02-16T00:00:00", "createdBy": "tester" } }`

- you will see app logging:
```bash
info: Process message of challenge id 5505f779-b28b-428f-888b-e523b443f3ea and project id 30055214
info: Found member ids [40152933, 40141336] of project id 30055214
info: Created resource: {
    "challengeId": "5505f779-b28b-428f-888b-e523b443f3ea",
    "memberHandle": "lordofparadox",
    "roleId": "6605f779-b28b-428f-888b-e523b443f3ea",
    "id": "d4ac5715-b1ed-430b-86ca-56d022c97ce9",
    "memberId": "9e2ad182-d4f7-4c4d-9421-29bc8bd56dfb",
    "created": "2019-08-20T23:02:45.818Z",
    "createdBy": "mock-api"
}
info: Created resource: {
    "challengeId": "5505f779-b28b-428f-888b-e523b443f3ea",
    "memberHandle": "SethHafferkamp",
    "roleId": "6605f779-b28b-428f-888b-e523b443f3ea",
    "id": "8a835c7e-5a90-47f1-a020-c95c415e32db",
    "memberId": "980bd2a6-b4b6-4253-87e7-67cb931a76a2",
    "created": "2019-08-20T23:02:45.822Z",
    "createdBy": "mock-api"
}
info: Successfully processed message of challenge id 5505f779-b28b-428f-888b-e523b443f3ea and project id 30055214
```


- you may write invalid messages like:
  `{ "topic": "challenge.notification.create", "originator": "challenge-api", "timestamp": "2019-02-16T00:00:00", "mime-type": "application/json", "payload": { "id": "abc", "typeId": "7705f779-b28b-428f-888b-e523b443f3ea", "track": "code", "name": "test", "description": "desc", "timelineTemplateId": "8805f779-b28b-428f-888b-e523b443f3ea", "phases": [{ "id": "8805f779-b28b-428f-888b-e523b443f3eb", "name": "phase", "isActive": true, "duration": 1000 }], "prizeSets": [{ "type": "Challenge prizes", "prizes": [{ "type": "1st", "value": 600 }] }], "reviewType": "community", "tags": ["tag1"], "projectId": 30055214, "startDate": "2019-02-19T00:00:00", "status": "Draft", "created": "2019-02-16T00:00:00", "createdBy": "tester" } }`

  `{ "topic": "challenge.notification.create", "originator": "challenge-api", "timestamp": "2019-02-16T00:00:00", "mime-type": "application/json", "payload": { "id": "5505f779-b28b-428f-888b-e523b443f3ea", "typeId": "7705f779-b28b-428f-888b-e523b443f3ea", "track": "code", "name": "test", "description": "desc", "timelineTemplateId": "8805f779-b28b-428f-888b-e523b443f3ea", "phases": [{ "id": "8805f779-b28b-428f-888b-e523b443f3eb", "name": "phase", "isActive": true, "duration": 1000 }], "prizeSets": [{ "type": "Challenge prizes", "prizes": [{ "type": "1st", "value": 600 }] }], "reviewType": "community", "tags": ["tag1"], "projectId": 30055214, "startDate": "2019-02-19T00:00:00", "status": "Draft", "created": "abc", "createdBy": "tester" } }`

  `{ [ { abc`
- then in the app console, you will see error messages


- to test the health check API, start the processor, then browse `http://localhost:3000/health` in a browser,
  and you will see result `{"checksRun":1}`, you may change the health check API port by setting `PORT` environment variable

