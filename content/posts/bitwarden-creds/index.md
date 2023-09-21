---
title: "A Makeshift Bitwarden Credential Sync Solution for Docker"
date: 2023-02-02T00:00:00-00:00
tags: ["docker", "bitwarden" ]
summary: "A simple approach for managing docker-compose passwords and keys 🔑"
url: "/docker-secret-management/"
---

I run several docker containers – all with docker-compose. All of my compose files are in a GitHub repository. However, I'm forced to keep this repository private due to some compose files containing passwords and API keys in plain text.

The obvious solution is to remove the credentials from the compose and use .env files instead. This allows me to pass in secrets as variables instead.

Let's say, for example, your docker directory looks like this:

```go
~/
└── docker/
    └── myContainer/
        ├── docker-compose.yaml
        └── .env
```

We can store passwords and other secrets in the .env file:

```bash
username=myUsername@email.com
password=mySuperSecretPassword
```

Then call on these in our compose file:

```yaml
version: "3"
services:
  hello_world:
    image: hello-world
    environment:
      username: ${username}
      password: ${password}
```


Now we can add `.env` to our `.gitignore` file and commit with the confidence our passwords are not exposed in a public repository.

### The Problem

Great! No more secrets in the source repo. But therein lies the problem.

![img](/img/bitwarden-creds/creds.webp)

If I need to quickly rebuild my containers on a new host. I need to clone the repository, and then painstakingly enter all the credentials into the .env file before spinning up any of the containers.

I also store these credentials in Bitwarden. This means any changes have to be made both in the .env file as well Bitwarden.

I could not find any pre-existing solutions that solved this problem. So I decided to come up with my own.

### The Bash Script

After playing around with [Bitwarden-CLI](https://bitwarden.com/help/cli/?ref=scottmckendry.tech) I had a rough idea of how the script would work. Rather than having individual .env files for each container, I would create one master .env file containing all of the secrets stored in my Bitwarden Docker Folder. It would then copy this .env file to all of my container directories.

Before:

```go
~/
├── docker/
│   ├── container1/
│   │   └── docker-compose.yaml
│   └── container2/
│       └── docker-compose.yaml
└── Bitwarden/
    └── BitwardenSync.sh
```

After:

```go
~/
├── docker/
│   ├── container1/
│   │   ├── docker-compose.yaml
│   │   └── .env (copy)
│   └── container2/
│       ├── docker-compose.yaml
│       └── .env (copy)
└── Bitwarden/
    ├── BitwardenSync.sh
    └── .env (master)
```

Credentials are added to .env files in `[name]=[password]` format.

I am by no means an expert when it comes to Bash scripting. So the following is a mishmash of Stack Overflow answers. Please be nice...

```bash
#!/bin/bash

# Bitwarden Sync Script
# Copy passwords from Bitwarden to an .env file for docker-compose

# Depends on bitwarden-cli and jq

#vars - fill these in before running!
bwUsername=''
dockerFolderId='' # Bitwarden Folder ID containing your docker-related credentials.
dockerDirectory='' # Directory containing all docker conatiners (expexcts dockerDirectory > ontiainerDir > docker-compose.yaml format.)

# dependencies check
dependencies=( "jq" "bw" )
for dep in "${dependencies[@]}"
do
    command -v $dep >/dev/null 2>&1 || { 
        echo >&2 "$dep required"; 
        exit 1; 
    }
done

# login and refresh bitwarden
echo -n "Please enter your master password: "
read -s bwPassword
echo
echo "Logging into Bitwarden..."
sessionkey=$(bw login $bwUsername $bwPassword --raw)
echo "Syncing Bitwarden..."
bw sync --session $sessionkey

#Return matching creds
echo "Retrieving docker credentials..."
items=$(bw list items --folderid $dockerFolderId --session $sessionkey)

#Convert the returned items to an array of IDs
itemIds=( $(echo $items | jq '.[].id') )
echo "Found ${#itemIds[@]} credentials. Writing them to the master .env file..." 

#Create .env file
rm .env > /dev/null
touch .env

for id in "${itemIds[@]}"
do
    # Remove quotes from ID
    id=$(echo "$id" | tr -d '"')

    itemJson=$(bw get item $id --session $sessionkey)
    #Get the credential name and password
    credName=$(echo $itemJson | jq '.name' | tr -d '"')
    credPass=$(echo $itemJson | jq '.login.password' | tr -d '"')

    #WriteCredentials to master.env file
    echo "$credName=$credPass" >> .env
done

# distiribute master .env file to docker directories.
echo "Copying env file to docker directories..."
find $dockerDirectory -maxdepth 1 -type d -exec cp .env {} \;

bw logout
```

{{< alert icon=lightbulb >}}
The script depends on the Bitwarden-CLI & JQ packages. You'll need to install both before running. You'll also want to fill in the variables near the top of the script.
{{< /alert >}}

Now whenever I need to add a new credential for one of my containers, All I need to do is add it to my Bitwarden Docker folder and re-run the script. Once complete, the credential is available to all of my containers!

### Installation

```bash
cd ~
curl -o BitwardenSync.sh https://gist.githubusercontent.com/scottmckendry/8dd2be06f99ff21efe3c39fe920555ea/raw
chmod +x BitwardenSync.sh
```

Download the script in your home directory and make it executable

### Automate?

Yes, you could automate the script with cron. So long as you're comfortable storing your master password in the script or in a text file.

For my use case, the rate of change is just too low to justify an automated approach. In most cases, I'm going to log into the host to start the container anyway.

### No Docker Folder in Bitwarden

Having a separate folder in Bitwarden seemed to be the simplest approach for my use case. However, you can also return Bitwarden items using the [--search](https://bitwarden.com/help/cli/?ref=scottmckendry.tech#list) and [--url](https://bitwarden.com/help/cli/?ref=scottmckendry.tech#list) flags.

Collection and Organisation filters are also available.
