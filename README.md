# Auction Service
A simple app that allows user to create auctions and make bids on them. This uses [Serverless](https://www.serverless.com/) to deploy everything on AWS.\
This was made while I was going through the course [Serverless Framework Bootcamp: Node.js, AWS & Microservices](https://www.udemy.com/course/serverless-framework/) on Udemy.

***

This application consists of following services :
  - **Auction** : The main service that contains APIs to create, get and process auctions as well as placing bids on auctions.
  - **Auth** : This service Auth0 to authorize the users. This service is used by Auction service.
  - **Notification** : This service is used by Auction service to send email to sellers and bidders. This uses AWS SQS ans SES to send emails to the users.