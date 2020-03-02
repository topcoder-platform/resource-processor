
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

