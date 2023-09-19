---
title: "Traefik - Replacing Basic Authentication with Azure SSO Using ForwardAuth"
date: 2023-01-29T00:00:00-00:00
tags: ["traefik", "azure", "docker"]
summary: "Configuring SSO for Traefik using Azure Active Directory 🔓"
url: "/traefik-replacing-basic-authentication-with-sso/"
---

Out of the box, Traefik has a simple basic auth middleware that can be used for proxied apps that don't have their own authentication solution.

If you followed my [Traefik configuration guide](https://scottmckendry.tech/traefik-ssl-all-the-things/), you would already be using Traefik's [basic authentication solution](https://doc.traefik.io/traefik/middlewares/http/basicauth/?ref=scottmckendry.tech). In this guide, we'll be replacing this middleware with [FowardAuth](https://doc.traefik.io/traefik/middlewares/http/forwardauth/?ref=scottmckendry.tech).

### Why not BasicAuth?

[BasicAuth](https://doc.traefik.io/traefik/middlewares/http/basicauth/?ref=scottmckendry.tech) is a quick and easy solution to secure a service you're not exposing publicly. However, its lack of MFA and having to enter a username and password when switching between services was enough to make the switch. It also gives me an opportunity to learn something new, which is always welcome.

### FowardAuth

[FowardAuth](https://doc.traefik.io/traefik/middlewares/http/forwardauth/?ref=scottmckendry.tech) is Traefik's built-in solution for forwarding Authentication to an external auth service. OAuth & OIDC services are supported. Previously, I had set this up with Google SSO using Google's Cloud API. In this guide, we'll be configuring SSO using Azure Active Directory.

![img](/img/traefik-az-sso/forward-auth.webp)

We will supplement the ForwardAuth middleware with thomseddon's [Forward Auth docker image](https://github.com/thomseddon/traefik-forward-auth?ref=scottmckendry.tech). This will be our dedicated endpoint for all authentication requests.

### Add a DNS entry

From your DNS provider, add a new entry for your auth endpoint. I suggest using something like 'auth.subdomain.example.com' or 'aad.subdomain.example.com'.

Here's the entry I've added in Cloudflare:

![img](/img/traefik-az-sso/dns.webp)

Nyx is the subdomain configured with the SANS certificate in my Traefik guide

### Create the Azure App

From the Azure Portal, navigate to the [App Registrations blade](https://portal.azure.com/?ref=scottmckendry.tech#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps) and click **New Registration**.

Give it a relevant name and add a web redirect URI with your newly created subdomain E.g `https://[serviceUrl]/_oauth`. Click Register.

{{< alert icon=lightbulb >}}
The Azure interface only lets you add one redirect when creating a new registration. Additional URIs can be added from the Authentication tab after creation.  
  
It's important to add the URL for each of the services you want to protect with SSO.
{{</ alert >}}

Under **Certificates & Secrets**, generate a new secret for the application. Make sure to copy it and keep it somewhere safe. Secrets will only appear once.

### Create the Auth Container

Next, we're going to create our Auth container using thomseddon's [Forward Auth docker image](https://github.com/thomseddon/traefik-forward-auth?ref=scottmckendry.tech). In my config, I've tacked this onto my Traefik docker-compose file:

```yaml
  auth:
    container_name: auth
    image: thomseddon/traefik-forward-auth:latest
    depends_on:
      - traefik
    networks:
      - traefik
    environment:
      - DEFAULT_PROVIDER=oidc
      - PROVIDERS_OIDC_ISSUER_URL=https://sts.windows.net/[tenantID]/
      - PROVIDERS_OIDC_CLIENT_ID=[clientID]
      - PROVIDERS_OIDC_CLIENT_SECRET=[clientSecret]
      - COOKIE_DOMAIN=[yourDomain]
      - LOG_LEVEL=debug
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.auth.entrypoints=http"
      - "traefik.http.routers.auth.rule=Host(`aad.[subdomain.example.com]`)"
      - "traefik.http.middlewares.auth-https-redirect.redirectscheme.scheme=https"
      - "traefik.http.routers.auth.middlewares=auth-https-redirect"
      - "traefik.http.routers.auth-secure.entrypoints=https"
      - "traefik.http.routers.auth-secure.rule=Host(`aad.[subdomain.example.com]`)"
      - "traefik.http.routers.auth-secure.tls=true"
      - "traefik.http.routers.auth-secure.service=auth"
      - "traefik.http.services.auth.loadbalancer.server.port=4181"
      - "traefik.docker.network=traefik"
    restart: unless-stopped
networks:
  traefik:
    external: true
```

Make sure to check all environment variables and labels to ensure you've removed **ALL** placeholders.

### Create/Update the Auth Middleware

In the Traefik config file, add or update your auth Middleware to the following:

```yaml
http:
  middlewares:
    auth:
      forwardAuth:
        address: "http://auth:4181"
        trustForwardHeader: true
        authResponseHeaders:
          - "X-Forwarded-User"
```

### Add the Auth Middleware to Your App

To require AAD authentication on a container or service, just update your middleware label to include 'auth@file'. Here's an example:

```yaml
- "traefik.http.routers.traefik-secure.middlewares=ipWhiteList@file, auth@file"
```

{{< alert >}}
**IMPORTANT:** Make sure you include each service in your App Registrations Redirect URI list. The list should include all hosts you intend to authenticate from.
{{</ alert >}}

If you see the message below, the URL you're trying to access is not in the App Registrations URIs:

![img](/img/traefik-az-sso/error.webp)

Also check that the URI is in `https://[serviceUrl]/_oauth` format

### Test Your Apps

Now if you go to one of the hosts you've configured for auth, you will be swiftly redirected to your organisation's login page:

![img](/img/traefik-az-sso/login.webp)

Because we've configured a persistent cookie across our domain, you'll only need to sign in once. Pretty neat!

### Troubleshooting

As with any undertaking like this one, you're more than likely to run into some problems along the way. Both Traefik and thomseddon's forward auth containers have great logging, which was invaluable when configuring the solution.

Logs can be viewed from your docker host server using:

```bash
docker logs auth
```
and:

```bash
docker logs traefik
```
with 'auth' and 'traefik' being the names of the respective containers. There is also plenty of helpful documentation on the GitHub repo:

{{< github repo="thomseddon/traefik-forward-auth" >}}
