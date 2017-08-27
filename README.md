# rxstore
An reactivex store implementation. This project called rxstore is an alternative to Redux and other state management
solutions for user interfaces. It originates in a feeling that the Redux ecosystem is trying to come up with solutions
for problems that have already been solved. rxstore itself is just a thin layer around [RxJS](https://github.com/ReactiveX/rxjs).
RxJS is responsible for the heavy tasks of handling data flow, asynchronous actions, store dependencies and much more.

rxstore exists as a wrapper around RxJS in order to…

 - establish a common terminology in teams which want to use RxJS in order to maintain application state,
 - ensure that stores and actions on those stores have a defined behavior,
 - a store only every has a single value for all subscribers and to
 - enable development tool support, i.e. rxstore store states can be exposed in order to generate views in browser
   developer tools.

## When would I use rxstore?
It would be easy to assume that I dislike Redux based on the fact that rxstore is an alternative. I assure you, this
is not the case. Redux and the community around it has done and is continuing to do many good things for the JS
community at large. Since Redux is commonly used in the JS community, has a helpful community and great docs, it is
good choice for beginners. **rxstore is probably not a good choice for beginners.** rxstore on the other hand has
very limited docs and a community that can be summarized as non-existent.

So, when would you use rxstore? rxstore will come in handy when…

 - you are working on an ambitious project (in terms of project size and performance requirements),
 - when the team is knowledgable in the RX space
 - when you will need to handle lots of push updates.

A variation of rxstore is in use in [Instana](https://www.instana.com/) and has proven itself to be able to handle a
lot of push updates, complicated store dependencies while still being easy enough to learn.

## Installation and Usage
rxstore is split into sub packages, each having its own documentation within the readme.

 - [rxstore](./packages/rxstore): The store implementation and foundation for the other packages.
 - [rxstore-react](./packages/rxstore-react): Contains helpers to efficiently bind stores to React components.
