# Why Udaru

Authentication (or Identity as its also referred to these days) is relatively easy, and can be considered a solved problem - it's largely standardized (OAuth, OpenId) and we have several good commercial and open source products to choose from. 

Authorization by comparison, has always been hard. There are no standards ([XACML](https://en.wikipedia.org/wiki/XACML) failed to get traction). Authorization is always application specific. It's also one of those things that everyone seems to do differently and nobody is really ever happy with - 'how do you guys do authorization?' is usually a question that's followed by a sharp intake of breath!

We've seen a minefield of different problems:

* mix ups between what is identity and what is authorization
* mix ups between identity roles (e.g. 'Fireman') vs authorization roles (e.g. 'CanDriveFireTruck')
* it's generally intertwined with business logic, sometimes deeply so (i.e. permission logic spread throughout code and database)
* this leads to monolithic systems as the authorization is impossible to decouple
* the large the system gets, the more brittle the authorization, the more risky changes get
* roles and permissions being put in identity tokens - it may seem like a good idea at the start but it leads to a lot of problems!
* governance is next to impossible

## Udaru Features

We developed Udaru in an attempt to fix these problems. Udaru is first an foremost a standalone Authorization service, which is architected for use in modern day distributed, microservice based systems. It's fully decoupled from Authentication - after all they are two distinct things - and is designed to be flexible and comprehensive enough to be dropped in to any solution.

Here are its high level features:

* Policy Based Access Control (PBAC) model, heavily inspired by Access Management in [AWS IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction_access-management.html) and other tools like [Ladon](https://github.com/ory/ladon) and [KeyCloak](http://www.keycloak.org/).
* Supports Organizations, nested Teams, and User entities that are used to build the access model.
* Policies can be attached to Users, Teams and Organizations. 
* Two primary REST APIs: a Management API for managing Organizations, Teams and Users, and an Authentication API for permission management.
* Available for use as a Node.js module, as a [Hapi](http://hapijs.com) plugin, and as a standalone service.
* The Management API can be used to easily build Administration tools.
* Supports static and dynamic policies; static policies are authorization rules that don't change, dynamic policies are policies that can be created on the fly, this allows advanced features such as users sharing specific data with each other.
* The Management API also makes governance quick and exact, i.e. you can query to see who exactly has access to what in your system in real time.

For more, see the main Udaru [documentation](./overview.md).

## Udaru Roadmap

We are very happy with the progress of Udaru to date; we started developing it in November 2016 with the nearForm Pathfinders team. Since then, we have successfully used it on several large production projects, with several more in the pipeline for 2017, so we consider it to be trusted and hardened.

Now that we've proven it's fit for use, there are several new features we'd like to see in Udaru:

* Improved documentation and examples.
* Some simplification around core APIs.
* A user interface to make it easy to administer Organizations, Teams, Users and view Policies.
* A plugin mechanism to add a callback hook to the core `isUserAuthorised` call, i.e.  https://github.com/nearform/udaru/blob/04767e1c5a0197f6a1853ada535419086a599b19/lib/core/lib/ops/authorizeOps.js#L29-L43. This hook will allow add-on tools and modules to be built that can take full advantage of the incredibly rich information Udaru is processing.
* An Audit Log feature; this would be an add-on module that gives a full Audit Trail API, i.e who tried to access what and when, etc.
* Fraud detection; using Machine Learning (Naive Bayes) to analyse the Audit Trail for possible fraud anomalies, e.g. Spiderman is accessing the platform on the weekend and is accessing data he doesn’t normally access, raise an alert. 
* Automatic enforcement of system of least privilege - use profiling data to remove permissions that are demonstrably not used. This idea totally stolen from Netflix's Repokid: https://medium.com/netflix-techblog/introducing-aardvark-and-repokid-53b081bf3a7e. 

If you're interesting in being involved in Udaru, please see the [contributing](contributing.md) guidelines.
