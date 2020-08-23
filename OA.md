**Matching Route Paths**
Express tries to match requests by route, meaning that if we send a request to `<server address>:<port number>/api-endpoint`, the Express server will search through any registered routes in order and try to match /api-endpoint.

Express searches through routes in the order that they are registered in your code. The first one that is matched will be used, and its callback will be called.

***

**Getting A Single Expression**
Routes become much more powerful when they can be used dynamically. Express servers provide this functionality with named route parameters. Parameters are route path segments that begin with : in their Express route definitions. They act as wildcards, matching any text at that path segment. For example `/monsters/:id` will match `both/monsters/1` and `/monsters/45`.

Express parses any parameters, extracts their actual values, and attaches them as an object to the request _object: req.params_. This object’s keys are any parameter names in the route, and each key’s value is the actual value of that field per request.

***

**Middleware**
Middleware is code that executes between a server receiving a request and sending a response. It operates on the boundary, so to speak, between those two HTTP actions.

In Express, middleware is a function. Middleware can perform logic on the request and response objects, such as: inspecting a request, performing some logic based on the request, attaching information to the response, attaching a status to the response, sending the response back to the user, or simply passing the request and response to another middleware. Middleware can do any combination of those things or anything else a Javascript function can do.

`app.use()` takes a callback function that it will call for every received request. 

_An Express application is essentially a series of middleware function calls._

It is precisely this service that we leverage Express for. In addition to performing the routing that allows us to communicate appropriate data for each separate endpoint, we can perform application logic we need by implementing the necessary middleware.

***


name is the name of your app
version is the current version
"private": true is a failsafe setting to avoid accidentally publishing your app as a public package within the npm ecosystem.
dependencies contains all the required node modules and versions required for the application. Here, it contains two dependencies, which allow us to use react and react-dom in our JavaScript. In the screenshot above, the react version specified is ^15.5.4. This means that npm will install the most recent major version matching 15.x.x. In contrast, you may also see something like ~1.2.3 in package.json, which will only install the most recent minor version matching 1.2.x.
devDependencies contains useful node modules and versions for using the React app in a development environment. Here, it contains one dependency, react-scripts, which provides a set of useful development scripts for working with React.
scripts specifies aliases that you can use to access some of the react-scripts commands in a more efficient manner. For example running npm test in your command line will run react-scripts test --env=jsdom behind the scenes.