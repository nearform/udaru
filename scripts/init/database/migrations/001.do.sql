
/* TODO: consider using unique non-sequential ids, for security
  (less predictabiity)
  probably GUID
 */
CREATE TABLE users (
  id        SERIAL UNIQUE,
  name      VARCHAR(50) NOT NULL
);

CREATE TABLE policies (
  id        SERIAL UNIQUE,
  name      VARCHAR(30) NOT NULL,
  effect    VARCHAR(30) NOT NULL,
  action    VARCHAR(30) NOT NULL,
  resource  VARCHAR(30) NOT NULL
);

CREATE TABLE organizations (
  id          SERIAL UNIQUE,
  name        VARCHAR(30) NOT NULL,
  description VARCHAR(30)
);

CREATE TABLE teams (
  id              SERIAL UNIQUE,
  name            VARCHAR(30) NOT NULL,
  description     VARCHAR(90),
  team_parent_id  INT REFERENCES teams(id),
  org_id          INT REFERENCES organizations(id) NOT NULL
);

CREATE TABLE team_members (
  team_id  INT REFERENCES teams(id) NOT NULL,
  user_id  INT REFERENCES users(id) NOT NULL
);

CREATE TABLE user_policies (
  user_id   INT REFERENCES users(id) NOT NULL,
  policy_id INT REFERENCES policies(id) NOT NULL
);

CREATE TABLE team_policies (
  team_id   INT REFERENCES teams(id) NOT NULL,
  policy_id INT REFERENCES policies(id) NOT NULL
);
