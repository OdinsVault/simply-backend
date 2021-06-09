# Simply API

### Dev build(in dev branch) is deployed in
[https://simply-server.herokuapp.com](https://simply-server.herokuapp.com)

- API is prefixed with current version `v1`
- Server deployment can be verified by above url(`GET` to `BASE_URL`)
- To checkout the APIs refer the below section
    - View online API doc/import the latest API collection to postman

---
### API documentation
view online: [https://documenter.getpostman.com/view/14306889/TWDfDYXA](https://documenter.getpostman.com/view/14306889/TWDfDYXA)


[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/6107e314930282bc26b0?action=collection%2Fimport)

---

## Environment variables

| Variable      | Description |
| ----------- | ----------- |
| MONGO_ATLAS_PW| MongoDB Atlas Cluster password|
| BASE_URL      | Base URL of the app(Domain)|
| JWT_KEY       | Key string to generate JWTs|
| ADMIN_EMAILS  | Comma seperated string of all emails of admins|
| ADMIN_PASSWORDS| Comma seperated passwords indexes matching to each Admin email|
| ORIGINS| Allowed origin domains as a comma delimited string : default *|



