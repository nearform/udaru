# Contributing to Udaru

Udaru is open source (MIT License) sponsored by [nearForm](https://www.nearform.com).

Please see the [README](<https://github.com/nearform/udaru>) for how to get started, running Udaru, testing Udaru, etc. Use [GitHub](<https://github.com/nearform/udaru/issues>) for any bugs, issues, or feature requests.

For general documentation, see the [Udaru Website](<https://nearform.github.io/udaru/>). If you have any feedback on Udaru, [please get in touch](<https://github.com/nearform/udaru/issues>).

## Core committers - how to release

It's a good idea to check that you have the latest version of npm installed before creating a new release: `npm install npm -g`

Udaru consists of 4 individual packages. While they are all published in their own independent lifecycle, they are also dependencies between them:

*   `@nearform/udaru-core`
*   `@nearform/udaru-hapi-plugin` (depends on `udaru-core`)
*   `@nearform/udaru-hapi-16-plugin` (depends on `udaru-core`)
*   `@nearform/udaru-hapi-server` (depends on `udaru-hapi-16-plugin`)

Be mindful of these dependencies when publishing, i.e. if you publish a new version of `udaru-core` you need to bump all the other packages also.

We are currently supporting node 6, 8 and 10.

1.  Review github issues, triage, close and merge issues related to the release.
2.  Update the CHANGES.md file.
3.  Navigate to the [Test Rig][Test] and ensure all tests are passing.
4.  Pull down the repository locally on the master branch.
5.  Ensure there are no outstanding commits and the branch is clean.
6.  From root, run `npm run test:commit-check` and sanity check testing and linting passes, and that there are no dependency issues.
7.  From root, run `npm run outdated:all` and review all dependencies. For each outdated dependency, make a call whether to update or not.
    -   Run `npm run update:all` to get all non breaking updates. We have a policy of using '^' for all dependencies in the package.json and using npm shrinkwrap for each release.
    -   Run `npm run outdated:all` again to review possible breaking and major revision updates.
    -   Create a github issue for any major update where appropriate.
8.  In the order of dependencies above, for each package:
    -   Run `npm install` and verify that root level and package dependencies correctly install.
    -   Run `npm test` to verify the tests run locally within their own context (something that's not done by CI)
9.  Run `npm run swagger-gen` to regenerate the Swagger documentation for the Udaru [documentation site][docs-site].
    -   Run `git add` and `git commit` to commit any version and documentation changes if there are any.
10. Finally, from root, log in to npm using `npm login`, run `lerna publish` and choose the approriate version change type.  This will update each  package.json of modified packages as appropriate, create a new git commit and tag, and publish updated packages to npm.
    -   Update root package.json to the correct version number and commit
11. Go to the [Github release page][Releases] and hit 'Draft a new release'.
12. Paste the Changelog content for this release and add additional release notes.
13. Choose the tag version and a title matching the release and publish.
14. Notify the #udaru slack channel

[Test]: https://travis-ci.org/nearform/udaru
[Releases]: https://github.com/nearform/udaru/releases
[docs-site]: https://nearform.github.io/udaru/

# Security testing of Udaru

Udaru has been extensively tested for SQL injections, please see [sqlinjection.md](./sqlinjection.md) for more information.

Aside from that, Udaru is occasionally tested with OWASP ZAProxy for any known security vulnerabilities. For a list, please see [pentests](./pentests) for more information.
