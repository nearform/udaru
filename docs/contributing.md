# Contributing to Udaru

Udaru is open source (MIT License) sponsored by [nearForm](https://www.nearform.com).

Please see the [README](<https://github.com/nearform/udaru>) for how to get started, running Udaru, testing Udaru, etc. Use [GitHub](<https://github.com/nearform/udaru/issues>) for any bugs, issues, or feature requests.

For general documentation, see the [Udaru Website](<https://nearform.github.io/udaru/>). If you have any feedback on Udaru, [please get in touch](<https://github.com/nearform/udaru/issues>).

## Core committers - how to release

It's a good idea to check that you have the latest version of npm installed before creating a new release. We are using npm shrinkwrap for releases and its behavior has been evolving. `npm install npm -g`

We are currently supporting node 6.

1.  Review github issues, triage, close and merge issues related to the release.
2.  Update the CHANGES.md file.
3.  Navigate to the [Test Rig][Test] and ensure all tests are passing.
4.  Pull down the repository locally on the master branch.
5.  Ensure there are no outstanding commits and the branch is clean.
6.  Run `npm install` and verify that root level and package dependencies correctly install.
7.  Run `npm run outdated:all` and review all dependencies.
8.  Run `npm run update:all` to get all non breaking updates. We have a policy of using '^' for all dependencies in the package.json and using npm shrinkwrap for each release.
9.  Run `npm run outdated:all` again to review possible breaking and major revision updates.
10. Create a github issue for any major update where appropriate.
11. Run `npm test` and ensure testing and linting passes.
12. Run `npm shrinkwrap`.
13. Run `npm run swagger-gen` to regenerate the Swagger documentation for the Udaru [documentation site][docs-site].
14. Run `git add` and `git commit` to commit any version and documentation changes if there are any.
15. Run `lerna publish` and choose the approriate version change type.  This will update each  package.json of modified packages as appropriate, create a new git commit and tag, and publish updated packages to npm.
16. Go to the [Github release page][Releases] and hit 'Draft a new release'.
17. Paste the Changelog content for this release and add additional release notes.
18. Choose the tag version and a title matching the release and publish.
19. Notify core maintainers of the release via email.

[Test]: https://travis-ci.org/nearform/udaru
[Releases]: https://github.com/nearform/udaru/releases
[docs-site]: https://nearform.github.io/udaru/

# Security testing of Udaru

Udaru has been extensively tested for SQL injections, please see [sqlinjection.md](./sqlinjection.md) for more information.
