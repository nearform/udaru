
CREATE EXTENSION ltree;

/* TODO: consider using unique non-sequential ids, for security
  (less predictabiity)
  probably GUID
 */
CREATE TABLE organizations (
 id          VARCHAR(20) UNIQUE,
 name        VARCHAR(64) NOT NULL,
 description VARCHAR(30)
);

/* TODO: need policies unique constraint on org_id, name */
CREATE TABLE policies (
  id          SERIAL UNIQUE,
  version     VARCHAR(20),
  name        VARCHAR(64) NOT NULL,
  org_id      VARCHAR REFERENCES organizations(id) NOT NULL,
  statements  JSONB
);

CREATE TABLE ref_actions (
  action      VARCHAR(100) NOT NULL
);

/* TODO: users should have additional 'username' column */
CREATE TABLE users (
  id        SERIAL UNIQUE,
  name      VARCHAR(50) NOT NULL,
  org_id    VARCHAR REFERENCES organizations(id) NOT NULL
);

CREATE TABLE teams (
  id              SERIAL UNIQUE,
  name            VARCHAR(30) NOT NULL,
  description     VARCHAR(90),
  team_parent_id  INT REFERENCES teams(id),
  org_id          VARCHAR REFERENCES organizations(id) NOT NULL,
  path            LTREE DEFAULT (text2ltree(currval('teams_id_seq')::varchar))
);

CREATE INDEX teams_path_gist_idx ON teams USING GIST (path);

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

CREATE TABLE organization_policies (
  org_id   VARCHAR(20) REFERENCES organizations(id) NOT NULL,
  policy_id INT REFERENCES policies(id) NOT NULL
);
