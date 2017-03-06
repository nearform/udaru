## SQL injection protection

Udaru is well protected against SQL injection. The following is the process we undertook to extensively test this.

Basic best practices to protect against SQL injection there are:
- Sanitize input
- Use prepared statements
- Whitelist input validation
- Least privileged DB users

The main protection factors in Udaru are:
- All SQL constructions use prepared statements - all injection attempts stop here
- Routes have an additional protection made by Joi - effective especially on parameters and fields that have a non string type (like integer)
- Udaru Core has an additional layer of protection made by Joi

## SQL injection vulnerabilities tests

In order to validate that the endpoints are not vulnerable to SQL injection we did the following:
- Test the endpoints automatically using the excellent [sqlmap](sqlmap.org) penetration testing tool
- Write route level injection tests following [OWASP Postgres Testing][] guidelines
- Write Udaru core level injection tests without the middleware level protection

We established three goals for the vulnerabilities to test at route level:
- Try to inject the 'get users' endpoint
- Try to add a higher privileges policy to a regular user
- Try to inject the access routes to affect the authorization result

## Get users endpoint

The get users endpoint request is the following:
`http://localhost:8080/authorization/users?page=1&limit=10`

### Endpoint `sqlmap` testing

The command with which tested the endpoint:
`python sqlmap.py -u "http://localhost:8080/authorization/users?page=1&limit=10" --method=GET --headers="authorization: ROOTid\norg: WONKA" --level=5 --risk=3 --dbms=postgresql -p "page,limit,org,authorization" --timeout 3 --flush-session`

Parameter details:
- Used an increased `risk` and `level` of testing than the default levels
- Specified the db type to help `sqlmap`
- A verbose level of 0 `-v 0` can be specified to display only the critical level errors. During investigation used a verbosity level of 5 to check the queries are correctly formed
- Used the `-p` parameter to specify which fields/params to be injection tested
- Specified a timeout of 3 seconds
- Added `--flush-session` to clear session between runs
- The `--batch` flag chooses default answers for the console questions

**No issues found** by `sqlmap` on this endpoint.

A sample on how an injection result report would contain if anything would be found is like:
```
sqlmap identified the following injection point(s) with a total of 3884 HTTP(s) requests:
---
Parameter: limit (GET)
    Type: stacked queries
    Title: PostgreSQL > 8.1 stacked queries (comment)
    Payload: page=1&limit=10';SELECT PG_SLEEP(5)--
---
```

### Endpoint manual verification and tests

The purpose of manual tests and verification was to try altering the functionality in any way not necessarily getting valid results. Any sign of a query being affected by injection can lead to more detailed injection research.

- Tried injecting the `limit` and `page` query strings - checked manually and also wrote tests useful for investigation. Joi rejects anything other than integer numbers. Disabled Joi to see that injection fails even with no Joi in place
- Tried injecting the `headers.org` field, this is unprotected by Joi (because it is defined as string) but it is used as param in prepared statements. The endpoint seems to be protected
- Tried a long string as org name
- Manually searched in code for SQL that might not use prepared statements - all SQL building is made with the `SQL()` internal function that builds the prepared statements
- Checked if it is needed to have whitelist maps
- Checked the SQL() function implementation and looked over unit tests

### Core manual verification and tests

We tried injecting the `listOgUsers` from `userOps.js` to validate the prepared statements protection. Injecting the `limit` and `page` params is rejected by the Joi internal checks. The `organizationId` is protected by the prepared statement and injection fails.

### Conclusions

As the query building is made using prepared statements, the `sqlmap` injection tests didn't find any issues. Also the manual tests and investigation established that the Joi validation stops most of the injection approaches providing a good second level of protection. Even with Joi manually disabled the prepared statements protection level stopped the injections.

The `SQL()` function that builds the prepared statements is a critical function and is well implemented.

## Add policy to user endpoint

The add policy to user endpoint request is the following:
`http://localhost:8080/authorization/users/CharlieID/policies`

### Endpoint `sqlmap` testing

The command with which tested the endpoint for user ID injection:
`python sqlmap.py -u "http://localhost:8080/authorization/users/CharlieId*/policies" --method=PUT --headers="authorization: CharlieId\norg: WONKA" --data="{\"policies\":[\"policyId9\"]}" --level=5 --risk=3 --dbms=postgresql --timeout 3 --flush-session`

The command with which tested the PUT payload injection:
`python sqlmap.py -u "http://localhost:8080/authorization/users/CharlieId/policies" --method=PUT --headers="authorization: CharlieId\norg: WONKA" --data="{\"policies\":[\"policyId9*\"]}" --level=5 --ris
k=3 --dbms=postgresql --timeout 3 --flush-session`

In the endpoints used `*` after the `CharlieId` user ID and in the to specify `sqlmap` to try to inject that param.

**No issues found** by `sqlmap` on this endpoint.

### Endpoint manual verification and tests

Injected the `authorization` and `org` fields. The same like for getting users it is stopped at Joi or prepared statements level.

### Core manual verification and tests

The `user ID` and `organization ID` injections are stopped at the Joi validation level of Udaru core. The `Statements` usage has two injection protection levels: the existence of the policy is verified against DB (this stops most of the injections) and the SQL also uses prepared statements.

### Conclusions

The Joi validation and prepared statements stopped all attempts to inject parameters.

## Inject the access routes

The authorize user action endpoint request is the following:
`http://localhost:8080/authorization/access/Charlieid/action_param/resource_param`

### Endpoint `sqlmap` testing

The command with which tested the endpoint for user ID injection:
`python sqlmap.py -u "http://localhost:8080/authorization/access/ManyPoliciesId*/a*/a*" --method=GET --headers="authorization: ROOTid\norg: WONKA" --level=5 --risk=3 --dbms=postgresql --timeout 3 --flush-session`

In the endpoint used `*` after the `ID`, `action` and `resource` to instruct `sqlmap` to try to inject them. Tried with both `ROOTid` and `ManyPoliciesId` for authorization. Tried injecting the URL parameters for the users `CharlieId` and `ManyPoliciesId`.

**No issues found** by `sqlmap` on this endpoint.

### Endpoint manual verification and tests

Injecting the route params is not related to SQL injection, the paths lead to [node-pbac][]. Tried injecting the `org` and `authorization` header fields.

### Core manual verification and tests

The injection passes the Joi validation but it is stopped by the prepared statement.

### Conclusions

The Joi validation and prepared statements stopped all attempts to inject parameters.

[node-pbac]: https://github.com/monken/node-pbac
[OWASP Postgres Testing]: https://www.owasp.org/index.php/OWASP_Backend_Security_Project_Testing_PostgreSQL
