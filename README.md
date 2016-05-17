Principal Service
=================

## Overview

PrincipalService is a component that provides access to rest APIs for people and groups.

## How to use it

How to generate API documentation:

1. Uncomment this line in server.js: "app.use(allowCrossDomain);"

2. Comment this line checking authentication: "app.use(authenticationChecker.check.bind(authenticationChecker));"

3. After launching the service visit this URL to check that API documentation is accessible: "http://127.0.0.1:4100/api/api-docs"

4. Visit "http://petstore.swagger.wordnik.com/" and copy "http://127.0.0.1:4100/api/api-docs" in the textbox and click Explore.

### Development

To ease doing REST requests in development environment, EYEOS_DEVELOPMENT_MODE will allow you to do requests without card.
```bash
EYEOS_DEVELOPMENT_MODE=true node src/eyeos-principalService.js
```

### Error Handling

There is an error class name `PrincipalServiceError` that should be used for all
business errors.

    try {
        createGroupFolder("foobar");
    } catch (err) {
        if (err.code == "EEXIST") {
            throw new PrincipalServiceError(
                "Group already exists",        // message
                "ERR_WORKGROUP_EXISTS",        // code
                {
                    "workgroup": "foobar"      // metadata
                },
                err                            // inner exception
            );
        } else {
            ...
        }
    }

* The `message` is for internal and debugging use. You should never ever use this
attribute for nothing else than explaining to another developer what happened.
* The `code` is a string giving info of what is the nature of the error.
* The `metadata` may help providing more info about the error (like which
  workgroup does already exist when calling to create new group).
* The `inner` exception may provide additional info when debugging. You should
  always wrap the real exception with our `PrincipalServiceError`.

This `PrincipalServiceError` will eventually get to the ExpressJS layer, where
we should notify of an error to the user probably. The `PrincipalServiceError`
has a method called `getPublicInfo(isInternalError)` that returns a POJO that
is safe to send to frontend. The `isInternalError` parameter is used to send
a generic error to the frontend (the frontend/user doesn't care if mongo isn't
responding to queries, for example) or to just clean the unneeded data (remove
the stack, inner exception and message, for example). You can check in some
`WhateverExpressAdapter.js` the way this is used.

### Component Tests

If you want to run the tests repeatedly, set the SKIP_DESTRUCTIVE_TESTS envar.

## Quick help

* Install modules

```bash
	$ npm install
```

* Check tests

```bash
    $ ./tests.sh
```
