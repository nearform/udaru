CREATE TABLE users (
  userId    SERIAL UNIQUE,
  name      VARCHAR(50)
);

CREATE TABLE policies (
  policyId  SERIAL UNIQUE,
  name      VARCHAR(30),
  effect    VARCHAR(30),
  action    VARCHAR(30),
  resource  VARCHAR(30)
);

CREATE TABLE roles (
  roleId    SERIAL UNIQUE,
  name      VARCHAR(30)
);
