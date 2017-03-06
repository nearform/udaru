# How to release

1.  Review github issues, triage, close and merge issues related to the release.
2.  Update the CHANGES.md file.
3.  Navigate to the [Test Rig][Test] and ensure all test are passing.
4.  Pull down the repository locally on the master branch.
5.  Ensure there are no outstanding commits and the branch is clean.
6.  Run `npm install` and ensure all dependencies correctly install.
7.  Run `npm run test` and ensure testing and linting passes.
8.  Run `npm version x.x.x -m "version x.x.x"` where `x.x.x` is the version.
9.  Run `git push upstream master --tags`
10. Run `npm publish`
11. Go to the [Github release page][Releases] and hit 'Draft a new release'.
12. Paste the Changelog content for this release and add additional release notes.
13. Choose the tag version and a title matching the release and publish.
14. Notify core maintainers of the release via email.

[Test]: https://travis-ci.org/nearform/labs-authorization
[Releases]: https://github.com/nearform/labs-authorization/releases
