what be this appth you speak of???

Basic site that lets users store strings and gawk at them. add and delete to your hearts content! if your heart is 16.
yet another serverless full stack web app, a bit more complex than visitor counter 010 if you saw last episode

THE STACK (the stack)
Backend;
DynamoDB - stores usernames, passwords (unencrypted but dont tell anyone), number of strings, and a list of said strings
Lambda - just one that naturally handles managing the database. reads in an action variable then branches into several funcs (eg add string, delete string)
API Gateway - HTTP API that is fittingly the gateway to the lambda func. There's just one path that leads to the one lambda.

Frontend;
HTML - comes with a login page and dashbord... hubba hubba...
JavaScript - one for the login and one for the dashboard. filled with async functions that do the things you'd expect
