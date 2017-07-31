#!/bin/bash
set -e

SOURCE_BRANCH="master"
TARGET_BRANCH="master"
DIRNAME="$(cd "$(dirname "$0")" && pwd)"

function doCompile {
  npm run swagger-gen
}

# Pull requests and commits to other branches shouldn't try to deploy, just build to verify
if [ "$TRAVIS_PULL_REQUEST" != "false" -o "$TRAVIS_BRANCH" != "$SOURCE_BRANCH" ]; then
    echo "Skipping docs generation..."
    exit 0
fi

echo "generating udaru documentation..."

# Save some useful information
REPO=`git config remote.origin.url`
SSH_REPO=${REPO/https:\/\/github.com\//git@github.com:}
SHA=`git rev-parse --verify HEAD`
COMMIT_AUTHOR_EMAIL="$(git log -1 $TRAVIS_COMMIT --pretty="%cE")"

git checkout $TARGET_BRANCH

rm -rf $DIRNAME../docs/udaru-swagger-site

doCompile

git config user.name "Travis CI"
git config user.email "$COMMIT_AUTHOR_EMAIL"

# If there are no changes to the compiled out (e.g. this is a README update) then just bail.
if git diff --quiet; then
    echo "No changes to udaru-swagger-site; exiting."
    exit 0
fi

# Commit the "changes", i.e. the new version.
# The delta will show diffs between new and old versions.
git add -A .
git commit -m "Deploy to GitHub Pages: ${SHA} [skip ci]" -n

# # Get the deploy key by using Travis's stored variables to decrypt git_key.enc
ENCRYPTED_KEY_VAR="encrypted_${ENCRYPTION_LABEL}_key"
ENCRYPTED_IV_VAR="encrypted_${ENCRYPTION_LABEL}_iv"
ENCRYPTED_KEY=${!ENCRYPTED_KEY_VAR}
ENCRYPTED_IV=${!ENCRYPTED_IV_VAR}
openssl aes-256-cbc -K $ENCRYPTED_KEY -iv $ENCRYPTED_IV -in $DIRNAME/../git_key.enc -out $DIRNAME/../git_key -d
chmod 600 $DIRNAME/../git_key
eval `ssh-agent -s`
ssh-add $DIRNAME/../git_key

# # Now that we're all set up, we can push.
git push $SSH_REPO $TARGET_BRANCH