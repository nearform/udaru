# How to release

It's a good idea to check that you have the latest version of npm installed before creating a new release. We are using npm shrinkwrap for releases and its behavior has been evolving. `npm install npm -g`

We are currently supporting node 6 and testing on node versions 6 and 7.

1.  Review github issues, triage, close and merge issues related to the release.
2.  Update the CHANGES.md file.
3.  Navigate to the [Test Rig][Test] and ensure all test are passing.
4.  Pull down the repository locally on the master branch.
5.  Ensure there are no outstanding commits and the branch is clean.
6.  Run `npm install` and ensure all dependencies correctly install.
7.  Run `npm outdated` to and review all dependencies.
8.  Run `npm update` to get all non breaking updates. We have a policy of using '^' for all dependencies in the package.json and using npm shrinkwrap for each release.
9.  Run `npm outdated` again to review possible breaking and major revision updates.
10. Create a github issue for any major update were appropriate.
11. Run `npm run test` and ensure testing and linting passes.
12. Run `npm shrinkwrap`.
13. Run `git add` and `git commit` to commit any version changes if there are any.
14. Run `npm version x.x.x -m "version x.x.x"` where `x.x.x` is the version.
15. Run `git push upstream master --tags`
16. Run `npm publish`
17. Go to the [Github release page][Releases] and hit 'Draft a new release'.
18. Paste the Changelog content for this release and add additional release notes.
19. Choose the tag version and a title matching the release and publish.
20. Notify core maintainers of the release via email.

[Test]: https://travis-ci.org/nearform/udaru
[Releases]: https://github.com/nearform/udaru/releases
