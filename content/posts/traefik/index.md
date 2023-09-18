---
title: "Traefik - SSL All The Things!"
date: 202-01-23T00:00:00+00:00
tags: ["docker", "traefik" ] 
summary: "Put SSL/HTTPS on all of your Web Services with Traefik Reverse Proxy 🚦"
---
{{< lead >}}
Put SSL/HTTPS on all of your Web Services with Traefik Reverse Proxy 🚦
{{< /lead >}}

If you're like me and run multiple services through Docker containers on your home lab server, you've likely found yourself struggling to remember the port numbers you assigned to a given service.

You may have also felt the 'Not Secure' warning beckoning you from the URL bar every time you open an application, begging for SSL.

No more!

Traefik is here to solve all your routing and SSL issues. Not just for your docker containers but all of your services, even the ones running on a separate server entirely - like your router's web UI.

### Before we begin

This guide assumes Docker Compose is being used to manage containers. It also assumes you have a domain and are managing your DNS through Cloudflare. Other DNS providers may work but YMMV.

### File Structure

For starters, create the following file structure on your docker host. The rest of the guide assumes your files are in this structure:

```treeview
~
|-- docker
|   |-- traefik
|   |   `-- docker-compose.yml
|   `--  code-server
|   	`-- docker-compose.yml
`-- configs
	`-- traefik
		|-- acme.json
		|-- traefik.yml
		`-- dynamic
			`-- config.yml
```



Don't worry about the content of these files for now.

### Configuring Traefik

Traefik configuration is loaded from two files; **traefik.yml** and the dynamic **config.yml**.

Your traefik.yml will look something like this:

```yaml
api:
  dashboard: true
  debug: true
metrics:
  prometheus: {}
entryPoints:
  http:
    address: ":80"
  https:
    address: ":443"
serversTransport:
  insecureSkipVerify: true
providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
  file:
    directory: /dynamic
    watch: true
certificatesResolvers:
  cloudflare:
    acme:
      email: email@example.com #replace with your cloudflare email address
      storage: acme.json
      dnsChallenge:
        provider: cloudflare
        resolvers:
          - "1.1.1.1:53"
          - "1.0.0.1:53"
```



The dynamic file can be used to configure middleware and external services. We'll come back to that shortly.

### The Traefik Container

First off, we want to create a new directory and docker-compose file for Traefik. It should look something like this:

```yaml
# docker-compose.yml

version: "3"
services:
  traefik:
    image: traefik:latest
    container_name: traefik
    networks:
      - traefik
    environment:
    	# Enter your Cloudflare API credentials here
      - CF_API_EMAIL=
      - CF_API_KEY= 
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/locatime:/etc/localtime:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /[docker parent path]/configs/traefik/traefik.yml:/traefik.yml:ro
      - /[docker parent path]/configs/traefik/acme.json:/acme.json # where your certificates will be stored
      - /[docker parent path]/configs/traefik/dynamic:/dynamic:ro # The dynamic directory allows you to make 'hot' changes to traefik configuration without restarting the container
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik.entrypoints=http"
      - "traefik.http.routers.traefik.rule=Host(`traefik.subdomain.example.com`)" # Replace with your subdomain
      - "traefik.http.middlewares.traefik-https-redirect.redirectscheme.scheme=https"
      - "traefik.http.middlewares.sslheader.headers.customrequestheaders.X-Forwarded-Proto=https"
      - "traefik.http.routers.traefik.middlewares=traefik-https-redirect"
      - "traefik.http.routers.traefik-secure.entrypoints=https"
      - "traefik.http.routers.traefik-secure.rule=Host(`traefik.subdomain.example.com`)"
      - "traefik.http.routers.traefik-secure.tls=true"
      - "traefik.http.routers.traefik-secure.tls.certresolver=cloudflare"
      - "traefik.http.routers.traefik-secure.tls.domains[0].main=subdomain.example.com" # The subdomain configured for traefik E.g. homelab.scottmckendry.tech
      - "traefik.http.routers.traefik-secure.tls.domains[0].sans=*.subdomain.example.com" # The SANs wildcard domain the will be used for all services
      - "traefik.http.routers.traefik-secure.service=api@internal"
    restart: unless-stopped
networks:
  traefik:
    external: true
```
{{< alert icon=lightbulb >}}
**IMPORTANT:** Make sure you add a DNS entry for your Traefik container and point it to your public IP address. You'll also need to configure port forwarding rules for ports 80 and 443 on your router to your server.  
 
**Help:**
- [How Do I Create Sub-Sub-Domain on Cloudflare DNS?](https://stackoverflow.com/questions/30802595/how-do-i-create-sub-sub-domain-on-cloudflare-dns?ref=scottmckendry.tech)  
- [How to Forward Ports on Your Router](https://www.howtogeek.com/66214/how-to-forward-ports-on-your-router/?ref=scottmckendry.tech)
{{< /alert >}}

Check your file carefully and make sure to replace any dummy variables, paths and domains!

### Create a Docker Network and Start Traefik

If we start the Traefik container with the config above, we'll get the following output:

```bash
ERROR: Network traefik declared as external, but could not be found. Please create the network manually using `docker network create traefik` and try again.
```



In order for Traefik to communicate with other containers, we need to create a network. We can create one using the same syntax in the error message above:

```bash
docker network create traefik
```



Now we can start our Traefik container.

{{< alert icon=lightbulb >}}
To start and restart containers, run the following from the directory containing your docker-compose.yaml file.  

`docker-compose up -d --force-recreate` 

The `--force-recreate` flag restarts the container regardless of any changes to the compose file.
{{< /alert >}}

Now that we've started the container we should be able to access the Traefik dashboard by going to "traefik.subdomain.example.com". If everything is configured correctly, you should see the dashboard below:

![img](/img/traefik/traefik-dashboard.png)

You'll also see a valid certificate in the address bar. Congratulations, you're now serving your first HTTPS web application.

## Adding Containers

Now that Traefik is up and running, we can start adding services behind it. As an example, we'll use the [Linuxserver.io's openvscode-server](https://hub.docker.com/r/linuxserver/openvscode-server?ref=scottmckendry.tech) docker image.

### Old Config
The default docker-compose file is below:

```yaml
---
version: "2.1"
services:
  openvscode-server:
    image: lscr.io/linuxserver/openvscode-server:latest
    container_name: openvscode-server
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/London
    ports:
      - 3000:3000
    restart: unless-stopped
```

This will serve a VS Code server locally on http://[YourServerIp]:3000. With a few tweaks, we can serve it on our own subdomain with SSL.

### New Config
With a few updates, we can 'Traefik-ify' the container:

```yaml
---
version: "2.1"
services:
  openvscode-server:
    image: lscr.io/linuxserver/openvscode-server:latest
    container_name: openvscode-server
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/London
    # ports:
    #  - 3000:3000
    restart: unless-stopped

    # Traefik configuration:
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.code.entrypoints=http"
      - "traefik.http.routers.code.rule=Host(`code.subdomain.example.com`)"
      - "traefik.http.middlewares.code-https-redirect.redirectscheme.scheme=https"
      - "traefik.http.routers.code.middlewares=code-https-redirect"
      - "traefik.http.routers.code-secure.entrypoints=https"
      - "traefik.http.routers.code-secure.rule=Host(`code.subdomain.example.com`)"
      - "traefik.http.routers.code-secure.tls=true"
      - "traefik.http.routers.code-secure.service=code"
      - "traefik.http.services.code.loadbalancer.server.port=3000"
      - "traefik.docker.network=home"
networks:
  traefik:
    external: true
```

> 💡 Don't forget to add your DNS entry for 'code.subdomain'!

Start the container and navigate to the new URL. Great! Now we have a template we can apply to all of our containers.

But what if we want to expose a service to the public internet? We can't leave this container in its current state, anyone can use it! That's where middleware comes into play.

### Middlewares

Middlewares allow Traefik to manipulate requests before they reach your services. They can even outright deny access altogether. There are several middlewares available in the Traefik Plugin Catalog.

![img](/img/traefik/middlewares.png)

The three we're going to implement to tighten up security on our services are:

- [BasicAuth](https://doc.traefik.io/traefik/middlewares/http/basicauth/?ref=scottmckendry.tech) - Add a username and password to any Traefik router.
- [RateLimit](https://doc.traefik.io/traefik/middlewares/http/ratelimit/?ref=scottmckendry.tech) - Restrict the number of requests sent to a given service.
- [IPWhiteList](https://doc.traefik.io/traefik/middlewares/http/ipwhitelist/?ref=scottmckendry.tech) - Restrict access to a given service based on the IP address.

We define these in our dynamic config.yml file as shown below:

```yaml
http:
  middlewares:
	auth:
      basicAuth:
        users:        
          - "user:5f4dcc3b5aa765d61d8327deb882cf99" #MD5 Hash of "password"

    ratelimit:
      ratelimit:
        average: 100
        burst: 50
        
    ipWhiteList:
      ipWhiteList:
        sourceRange:
          - "192.168.1.0/24" #restricting to devices on the local network
          - "172.16.1.0/24" #and other containers on the same network e.g. the "traefik" network we created earlier.
```


{{< alert icon=lightbulb >}}
You can create your own password hash using "htpasswd" in a bash shell.
{{< /alert >}}

To add our newly created middleware to our container, we add the following label:

```yaml
	- "traefik.http.routers.code-secure.middlewares=auth@file, ipWhiteList@file, ratelimit@file"
```


Restart the container for our changes to take effect. When you reopen code server, you get a prompt to enter your username and password.

![img](/img/traefik/basic-auth.png)

If your IP is not whitelisted, you'll get a 403 forbidden error.

### Adding External Services

We now have a template for serving docker containers behind Traefik. But what if we want to add an external service behind the Traefik proxy? For example, our router/firewall configuration page?

This can also be done in the dynamic config.yaml file. First, we'll want to define a new middleware called "defaultHeaders" we can tack this on underneath the middleware we created earlier:

```yaml
    deafultHeaders:
      headers:
        frameDeny: true
        sslRedirect: true
        browserXssFilter: true
        contentTypeNosniff: true
        forceSTSHeader: true
        stsIncludeSubdomains: true
        stsPreload: true
        stsSeconds: 15552000
        customFrameOptionsValue: SAMEORIGIN
        customRequestHeaders:
          X-Forwarded-Proto: https
```

Without going into great detail, the above headers should allow most services to work behind Traefik. At least, I haven't run into any issues yet.

Now we can add an external service. I'm going to add my router's admin page. This can go beneath our default headers middleware:

```yaml
  routers:
    router:
      entrypoints:
        - "https"
      rule: "Host(`router.subdomain.example.com`)"
      middlewares:
        - ratelimit
        - ipWhiteList
        - auth
        - deafultHeaders
      tls: {}
      service: router
  services:
    router:
      loadBalancer:
        servers:
          - url: "https://192.168.1.1"
```


As you can see, we've also added our other middleware as well as default headers.

At this point, our config.yaml file should look something like this:

```yaml
http:
  middlewares:
	auth:
      basicAuth:
        users:        
          - "user:5f4dcc3b5aa765d61d8327deb882cf99" #MD5 Hash of "password"

    ratelimit:
      ratelimit:
        average: 100
        burst: 50
        
    ipWhiteList:
      ipWhiteList:
        sourceRange:
          - "192.168.1.0/24" #restricting to devices on the local network
          - "172.16.1.0/24" #and other containers on the same network e.g. the "traefik" network we created earlier.
    deafultHeaders:
      headers:
        frameDeny: true
        sslRedirect: true
        browserXssFilter: true
        contentTypeNosniff: true
        forceSTSHeader: true
        stsIncludeSubdomains: true
        stsPreload: true
        stsSeconds: 15552000
        customFrameOptionsValue: SAMEORIGIN
        customRequestHeaders:
          X-Forwarded-Proto: https
  routers:
    router:
      entrypoints:
        - "https"
      rule: "Host(`router.subdomain.example.com`)"
      middlewares:
        - ratelimit
        - ipWhiteList
        - auth
        - deafultHeaders
      tls: {}
      service: router
  services:
    router:
      loadBalancer:
        servers:
          - url: "https://192.168.1.1"
```


And that's it!

We've now successfully configured Traefik, a container and an external service all with valid SSL certificates.

My full config is available on my Github:

{{< github repo="scottmckendry/traefik" >}}
