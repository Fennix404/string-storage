# String Storage (v1.2.0)
what be this appth you speak of???

Basic site that lets users store strings and gawk at them. add and delete to your hearts content! yet another serverless full stack web app, a bit more complex than visitor counter 010 if you saw last episode

### The STACK (the stack)
#### Backened (via AWS!)

* DynamoDB - stores usernames, passwords (unencrypted but dont tell anyone), number of strings, a list of said strings, and various other counters and user data

* Lambda - just one that naturally handles managing the database. reads in an action string then branches into several functions accordingly (eg add string, delete string)

* API Gateway - HTTP API that is fittingly the gateway to the lambda func. There's just one path that leads to the one lambda.

* S3 - Stores user profile pictures!

* Amplify - where the site is hosted...

#### Frontend

* HTML - the usual

* CSS - sauce

* JavaScript - one for each html file, loaded with async functions that are called upon button clicks. local storage keeps track of various user data (such as the list of strings)


#### the link; https://main.d2kb5cw3bw7uzb.amplifyapp.com/


