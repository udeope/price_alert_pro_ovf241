# Price Alert Pro

A smart price monitoring application that helps you track product prices and get notified when they drop. Built with [Chef](https://chef.convex.dev) using [Convex](https://convex.dev) as its backend. Never miss a deal again!
  
This project is connected to the Convex deployment named [`clever-ibex-345`](https://dashboard.convex.dev/d/clever-ibex-345).

## Table of Contents

- [Project Structure](#project-structure)
- [App Authentication](#app-authentication)
- [Developing and Deploying Your App](#developing-and-deploying-your-app)
- [HTTP API](#http-api)
  
## Project Structure
  
The frontend code is in the [`src`](./src) directory and is built with [Vite](https://vitejs.dev/), a modern frontend build tool that provides a faster and leaner development experience.
  
The backend code is in the [`convex`](./convex) directory, which contains all the server-side logic for your application.
  
```bash
npm run dev
```

This command will start both the frontend and backend servers simultaneously, allowing you to develop and test your application locally.

## App Authentication

This app uses [Convex Auth](https://auth.convex.dev/) with Anonymous authentication, allowing users to sign in without creating an account. This provides a frictionless experience for testing and development. You may wish to configure additional authentication providers before deploying your app to production.

## Developing and Deploying Your App

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex:

* If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
* Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
* Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve your app further

## HTTP API

User-defined HTTP routes are defined in the [`convex/router.ts`](./convex/router.ts) file. We split these routes into a separate file from [`convex/http.ts`](./convex/http.ts) to allow us to prevent the LLM from modifying the authentication routes. You can add your custom API endpoints in the router file.
