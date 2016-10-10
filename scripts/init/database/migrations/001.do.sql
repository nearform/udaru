
/* TODO: consider using unique non-sequential ids, for security
  (less predictabiity)
 */
CREATE TABLE users (
  user_id   SERIAL UNIQUE,
  name      VARCHAR(50) NOT NULL
);

CREATE TABLE policies (
  policy_id SERIAL UNIQUE,
  name      VARCHAR(30) NOT NULL,
  effect    VARCHAR(30) NOT NULL,
  action    VARCHAR(30) NOT NULL,
  resource  VARCHAR(30) NOT NULL
);

CREATE TABLE organizations (
  org_id      SERIAL UNIQUE,
  name        VARCHAR(30) NOT NULL,
  description VARCHAR(30)
);

CREATE TABLE teams (
  team_id         SERIAL UNIQUE,
  name            VARCHAR(30) NOT NULL,
  description     VARCHAR(90),
  team_parent_id  INT REFERENCES teams(team_id),
  org_id          INT REFERENCES organizations(org_id) NOT NULL
);

CREATE TABLE team_members (
  team_id  INT REFERENCES teams(team_id) NOT NULL,
  user_id  INT REFERENCES users(user_id) NOT NULL
);

CREATE TABLE user_policies (
  user_id   INT REFERENCES users(user_id) NOT NULL,
  policy_id INT REFERENCES policies(policy_id) NOT NULL
);

CREATE TABLE team_policies (
  team_id   INT REFERENCES teams(team_id) NOT NULL,
  policy_id INT REFERENCES policies(policy_id) NOT NULL
);
