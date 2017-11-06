BEGIN;

/*
DELETE FROM team_policies WHERE 1=1;
DELETE FROM user_policies WHERE 1=1;
DELETE FROM team_members WHERE 1=1;
DELETE FROM teams WHERE 1=1;
DELETE FROM users WHERE 1=1;
DELETE FROM organization_policies WHERE 1=1;
DELETE FROM policies WHERE 1=1;
DELETE FROM organizations WHERE 1=1;
*/

INSERT INTO organizations (id, name, description)
VALUES
  ('ROOT','Super Admin','Super Admin organization'),
  ('OILCOEMEA','Oilco EMEA','Oilco EMEA Division'),
  ('OILCOUSA','Oilco USA','Oilco EMEA Division'),
  ('CONCH','Conch Plc','Global fuel distributors'),
  ('SHIPLINE','Shipline','World class shipping'),
  ('WONKA','Wonka Inc','Scrumpalicious Chocolate');


INSERT INTO users (id, name, org_id)
VALUES
  ('ROOTid','Super User','ROOT'),
  ('CharlieId','Charlie Bucket','WONKA'),
  ('MikeId','Mike Teavee','WONKA'),
  ('VerucaId','Veruca Salt','WONKA'),
  ('AugustusId','Augustus Gloop','WONKA'),
  ('WillyId','Willy Wonka','WONKA'),
  ('ModifyId','Modify Me','WONKA'),
  ('ManyPoliciesId','Many Polices','WONKA');


INSERT INTO teams (id, name, description, team_parent_id, org_id, path)
VALUES
  (1, 'Admins', 'Administrators of the Authorization System', NULL, 'WONKA', TEXT2LTREE('1')),
  (2, 'Readers', 'General read-only access', NULL, 'WONKA', TEXT2LTREE('2')),
  (3, 'Authors', 'Content contributors', NULL, 'WONKA', TEXT2LTREE('3')),
  (4, 'Managers', 'General Line Managers with confidential info', NULL, 'WONKA', TEXT2LTREE('4'));

INSERT INTO teams (id, name, description, team_parent_id, org_id, path)
  SELECT 5, 'Personnel Managers', 'Personnel Line Managers with confidential info', id, 'WONKA', TEXT2LTREE('5') FROM teams WHERE name = 'Managers'
UNION
  SELECT 6, 'Company Lawyer', 'Author of legal documents', id, 'WONKA', TEXT2LTREE('6') FROM teams WHERE name = 'Authors';


INSERT INTO team_members (user_id, team_id)
  SELECT 'CharlieId', id FROM teams WHERE name = 'Readers'
UNION
  SELECT 'VerucaId', id FROM teams WHERE name = 'Readers'
UNION
  SELECT 'VerucaId', id FROM teams WHERE name = 'Authors'
UNION
  SELECT 'AugustusId', id FROM teams WHERE name = 'Admins'
UNION
  SELECT 'WillyId', id FROM teams WHERE name = 'Managers'
UNION
  SELECT 'WillyId', id FROM teams WHERE name = 'Personnel Managers';


INSERT INTO policies (id, version, name, org_id, statements)
VALUES
('policyId1', 0.1, 'Director', 'WONKA', '{ "Statement": [{
          "Effect": "Allow",
          "Action": ["finance:ReadBalanceSheet"],
          "Resource": ["database:pg01:balancesheet"]
        },
        {
          "Effect": "Deny",
          "Action": ["finance:ImportBalanceSheet"],
          "Resource": ["database:pg01:balancesheet"]
        },
        {
          "Effect": "Allow",
          "Action": ["finance:ReadCompanies"],
          "Resource": ["database:pg01:companies"]
        },
        {
          "Effect": "Deny",
          "Action": ["finance:UpdateCompanies"],
          "Resource": ["database:pg01:companies"]
        },
        {
          "Effect": "Deny",
          "Action": ["finance:DeleteCompanies"],
          "Resource": ["database:pg01:companies"]
        }]}'::JSONB),
('policyId2', 0.1, 'Accountant', 'WONKA', '{ "Statement": [{
          "Effect": "Allow",
          "Action": ["finance:ReadBalanceSheet"],
          "Resource": ["database:pg01:balancesheet"]
        },
        {
          "Effect": "Deny",
          "Action": ["finance:ImportBalanceSheet"],
          "Resource": ["database:pg01:balancesheet"]
        },
        {
          "Effect": "Deny",
          "Action": ["finance:ReadCompanies"],
          "Resource": ["database:pg01:companies"]
        },
        {
          "Effect": "Deny",
          "Action": ["finance:UpdateCompanies"],
          "Resource": ["database:pg01:companies"]
        },
        {
          "Effect": "Deny",
          "Action": ["finance:DeleteCompanies"],
          "Resource": ["database:pg01:companies"]
        }]}'::JSONB),
('policyId3', 0.1, 'Sys admin', 'WONKA', '{ "Statement": [{
          "Effect": "Allow",
          "Action": ["finance:ReadBalanceSheet"],
          "Resource": ["database:pg01:balancesheet"]
        },
        {
          "Effect": "Allow",
          "Action": ["finance:ImportBalanceSheet"],
          "Resource": ["database:pg01:balancesheet"]
        },
        {
          "Effect": "Allow",
          "Action": ["finance:ReadCompanies"],
          "Resource": ["database:pg01:companies"]
        },
        {
          "Effect": "Allow",
          "Action": ["finance:UpdateCompanies"],
          "Resource": ["database:pg01:companies"]
        },
        {
          "Effect": "Allow",
          "Action": ["finance:DeleteCompanies"],
          "Resource": ["database:pg01:companies"]
        }]}'::JSONB),
('policyId4', 0.1, 'Finance Director', 'WONKA', '{ "Statement": [{
          "Effect": "Allow",
          "Action": ["finance:EditBalanceSheet"],
          "Resource": ["database:pg01:balancesheet"]
        }]}'::JSONB),
('policyId5', 0.1, 'DB Admin', 'WONKA', '{ "Statement": [{
          "Effect": "Allow",
          "Action": ["database:*"],
          "Resource": ["database:pg01:*"]
        }]}'::JSONB),
('policyId6', 0.1, 'DB Only Read', 'WONKA', '{ "Statement": [{
          "Effect": "Allow",
          "Action": ["database:Read"],
          "Resource": ["database:pg01:*"]
        }]}'::JSONB),
('policyId7', 0.1, 'DB only one table', 'WONKA', '{ "Statement": [{
          "Effect": "Allow",
          "Action": ["database:*"],
          "Resource": ["database:pg01:balancesheet"]
        }]}'::JSONB),
('policyId8', 0.1, 'URI read', 'WONKA', '{ "Statement": [{
          "Effect": "Allow",
          "Action": ["Read"],
          "Resource": ["/my/site/*"]
        }]}'::JSONB),
('policyId9', 0.1, 'SuperAdmin', 'ROOT', '{ "Statement": [{
        "Effect": "Allow",
        "Action": ["*"],
        "Resource": ["*"]
      }]}'::JSONB),
('policyId10', 0.1, 'Read All users', 'WONKA', '{ "Statement": [{
          "Effect": "Allow",
          "Action": ["Read"],
          "Resource": ["/myapp/users/*"]
        }]}'::JSONB),
('policyId11', 0.1, 'Read, Delete and Modify specific user', 'WONKA', '{ "Statement": [{
          "Effect": "Allow",
          "Action": ["Read", "Delete", "Edit"],
          "Resource": ["/myapp/users/username"]
        }]}'::JSONB),
('policyId12', 0.1, 'Read and Delete teams', 'WONKA', '{ "Statement": [{
          "Effect": "Allow",
          "Action": ["Read", "Delete"],
          "Resource": ["/myapp/teams/*"]
        }]}'::JSONB),
('policyId13', 0.1, 'Edit teams', 'WONKA', '{ "Statement": [{
          "Effect": "Allow",
          "Action": ["Edit"],
          "Resource": ["/myapp/teams/*"]
        }]}'::JSONB),
('policyId14', 0.1, 'Deny access to specific document', 'WONKA', '{ "Statement": [{
          "Effect": "Deny",
          "Action": ["Read"],
          "Resource": ["/myapp/documents/no_access"]
        }]}'::JSONB);

INSERT INTO policies (id, version, name, statements)
VALUES ('sharedPolicyId1', 0.1, 'Shared policy from fixtures', '{ "Statement": [{
          "Effect": "Allow",
          "Action": ["Read"],
          "Resource": ["/myapp/documents/*"]
        }]}'::JSONB);

INSERT INTO user_policies (user_id, policy_id)
  SELECT 'ROOTid', id FROM policies WHERE name = 'SuperAdmin'
UNION
  SELECT 'VerucaId', id FROM policies WHERE name = 'Accountant'
UNION
  SELECT 'ManyPoliciesId', id FROM policies WHERE name = 'Read All users'
UNION
  SELECT 'ManyPoliciesId', id FROM policies WHERE name = 'Read, Delete and Modify specific user'
UNION
  SELECT 'ManyPoliciesId', id FROM policies WHERE name = 'Read and Delete teams'
UNION
  SELECT 'ManyPoliciesId', id FROM policies WHERE name = 'Edit teams'
UNION
  SELECT 'ManyPoliciesId', id FROM policies WHERE name = 'Deny access to specific document';


INSERT INTO team_policies
  SELECT t.id, p.id
  FROM teams AS t
  INNER JOIN policies AS p
    ON  p.name = 'Director'
    AND p.org_id = 'WONKA'
  WHERE t.name = 'Admins';


COMMIT;
