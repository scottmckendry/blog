---
title: "Cloud Failover for \"Maintenance\" Using Azure Static Web App & Runbook"
date: 2023-02-04T00:00:00-00:00
tags: ["azure", "blog"]
summary: "My friendly status page for inevitable outages 🚧"
url: "/maintenance-web-app-azure/"
---

I self-host this website at home. I run a single server with no local replication. That means if my server goes down, so does my website.

I like to tinker, so this happens quite a bit.

When this happens, anyone visiting will get something like this:

![img](img/blog-failover/outage.png)

Which is fine. The website is not critical, nor is anything else running on the server and Cloudflare's 5XX error pages are always more user-friendly than nothing.

But what If I want to assure visitors that, given enough time, I'll get the site back up and running again? Maybe just something a bit more friendly?

### The Maintenance Page

I decided to base my maintenance page on the default Ghost Blog error page. I often see this when restarting the container:

![img](img/blog-failover/ghost-error.png)

So I sat down and wrote out some HTML and CSS to get this:

![img](img/blog-failover/maintenance.png)

I then published the assets to a [GitHub repository](https://github.com/scottmckendry/BlogMaintenancePage?ref=scottmckendry.tech), ready to be scooped up by Azure.

### Creating the Azure Web App

#Azure's [Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/overview?ref=scottmckendry.tech) were a good fit for my needs. They're serverless and, more importantly, free for personal projects. They also integrate with GitHub directly so I can push my changes to the app right from VS Code.

From the [Static Web Apps Blade](https://portal.azure.com/?quickstart=True&ref=scottmckendry.tech#view/HubsExtension/BrowseResource/resourceType/Microsoft.Web%2FStaticSites), I created a new web app and signed in using my GitHub account.

![img](img/blog-failover/create-web-app.png)

I could then select the repository I created earlier and fill in any settings specific to my project:

![img](img/blog-failover/create-web-app-2.png)

All that was left to do was click Review + Create. After a few seconds, the deployment was completed and my web app was live. A few more seconds later and the repo was published.

Azure will automatically assign a URL to the web app. Mine was given [https://happy-bush-034054e1e.2.azurestaticapps.net](https://happy-bush-034054e1e.2.azurestaticapps.net/?ref=scottmckendry.tech).

### Configuring a Custom Domain

Under custom domains, I added a blog domain, generated a 'txt' record and entered it into Cloudflare DNS. After a few minutes, my domain was validated.

![img](img/blog-failover/custom-domain.png)

{{< alert icon=lightbulb >}}
There's no need to fuss around with SSL certificates for Static Web Apps, this is provided by Azure automatically. 
{{< /alert >}}

### Configuring Redirects

One problem I noticed when testing failover was if I was viewing a page on my site beforehand, It would give me a 404 error if I tried to access the page again.

![img](img/blog-failover/404.png)

In order to fix this, I added a file named `staticwebapp.config.json` to my repository with the following content:

```json
{
    "responseOverrides": {
        "404": {
            "redirect": "/",
            "statusCode": 302
        }
    }
}
```

This meant whatever page a visitor was on previously, they would always see the maintenance page.

### Automating Failover

For planned maintenance, I can simply go to the Cloudflare dashboard and update the @ record for my site. For unplanned outages, such as a power cut or ISP issue at my house, this isn't going to help much. Especially if I'm not home.

Here a logic tree to show how the automation works:

{{< mermaid >}}
%%{init: {'theme':'dark'}}%%
flowchart
    A[Check Cloudflare for 'A' record] -->|'A' record exists| B(Not in failover state)
    A -->|'A' record does not exist| C(In failover state)
    B -->D(Send web request)
    C -->E(Check time since created)
    D -->|200 - OK| F(Do nothing)
    D -->|Other response| G(Replcate 'A' with 'CNAME')
    E -->|Record age < outage time| H(Do nothing)
    E -->|Record age > outage time| I(Replace 'CNAME' with 'A')
{{< /mermaid >}}

I opted to automate failover using an [Azure Runbook](https://learn.microsoft.com/en-us/azure/automation/overview?ref=scottmckendry.tech). I chose to write the script in PowerShell 7 since it's what I'm most comfortable with. Here's the full script:

```powershell
# FailoverRunbook.ps1
# Scott McKendry - Feburary 2023
#----------------------------------------------------------------
# Checks scottmckendry.tech to see if up, failing over to the SWA if it is down.
# Runs after failover check for a given expected outage period and revert the changes after that period completes.

# Variables:
$domain = "scottmckendry.tech"
$failover = "happy-bush-034054e1e.2.azurestaticapps.net"
$revertAfterMins = 29

# Retrieve Azure Automation Account Credentials
$cloudflareCredentials = Get-AutomationPSCredential -Name "Cloudflare"
$zoneAndIpCredentials = Get-AutomationPSCredential -Name "ZoneAndIP"
$cloudflareEmail = $cloudflareCredentials.Username
$cloudflareApiKey = $cloudflareCredentials.GetNetworkCredential().Password
$zone = $zoneAndIpCredentials.Username
$ip = $zoneAndIpCredentials.GetNetworkCredential().Password

# Cloudflare API Headers
$headers = @{
    "X-Auth-Email" = $cloudflareEmail
    "X-Auth-Key" = $cloudflareApiKey
}

# Get A record from the cloudflare
$requestUrl = "https://api.cloudflare.com/client/v4/zones/$($zone)/dns_records/?name=$($domain)&type=A"
$recordToCheck = Invoke-RestMethod -Uri $requestUrl -Method Get -Headers $headers
$recordId = $recordToCheck.result.id

# A Record exists, check to see if the site is up
if ($recordId) {
    $targetUrl = "https://$($domain)"
    $websiteResponse = Invoke-WebRequest -uri $targetUrl -SkipHttpErrorCheck
    $returnCode = $websiteResponse.StatusCode

    if ($returnCode -eq 200)
    {
        Write-Host "Web is Up."
    }
    else {
        # Delete A record
        $requestUrl = "https://api.cloudflare.com/client/v4/zones/$($zone)/dns_records/$recordId"
        Invoke-WebRequest -Uri $requestUrl -Method Delete -Headers $headers | Out-Null
        
        # Create CNAME record
        $newCnameRecord = @{
            "type" = "CNAME"
            "name" = "@"
            "content" = $failover
            "proxied" = $true
        }
        $body = $newCnameRecord | ConvertTo-Json
        $requestUrl = "https://api.cloudflare.com/client/v4/zones/$($zone)/dns_records"
        Invoke-WebRequest -Uri $requestUrl -Method Post -Headers $headers -Body $body -ContentType "application/json" | Out-Null
        Write-Host "Web is down. Failed over to SWA."
    }
}

# No A record == Failed Over in a previous run
else {
    # Get the CNAME record
    $requestUrl = "https://api.cloudflare.com/client/v4/zones/$($zone)/dns_records/?name=$($domain)&type=CNAME"
    $recordToCheck = Invoke-RestMethod -Uri $requestUrl -Method Get -Headers $headers
    $recordId = $recordToCheck.result.id

    # Get offset of created time vs current time
    $recordCreatedTime = $recordToCheck.Result.created_on
    $currentTime = Get-Date -AsUtc
    $offset = $currentTime - $recordCreatedTime

    # If created longer than revertAfter, revert changes
    if ($offset.TotalMinutes -gt $revertAfterMins) {
         # Delete CNAME record
         $requestUrl = "https://api.cloudflare.com/client/v4/zones/$($zone)/dns_records/$recordId"
         Invoke-WebRequest -Uri $requestUrl -Method Delete -Headers $headers | Out-Null
         
         # Create A record
         $newCnameRecord = @{
             "type" = "A"
             "name" = "@"
             "content" = $ip
             "proxied" = $true
         }
         $body = $newCnameRecord | ConvertTo-Json
         $requestUrl = "https://api.cloudflare.com/client/v4/zones/$($zone)/dns_records"
         Invoke-WebRequest -Uri $requestUrl -Method Post -Headers $headers -Body $body -ContentType "application/json" | Out-Null
         Write-Host "Expected outage time complete. Reverting DNS Changes"
    }
    else {
        Write-Host "Within expected outage time. No change to DNS."
    }
}
```

This is set up to run every 10 minutes. Azure only lets you run automation actions once every hour. But we can work around this by adding more schedules:

![img](img/blog-failover/schedules.png)

### Better Alternatives

Considering this entire solution is effectively free, I'm pretty happy with it. It hasn't been in place long enough to comment on its usefulness yet but it looks promising.

I'm not super happy with the runbook approach. I'd prefer a more responsive failover - 10 minutes is a bit too slow for my taste. The better alternative would be to use [Cloudflare Load Balancing](https://www.cloudflare.com/en-gb/load-balancing/?ref=scottmckendry.tech) (paid service) which allows for instant failover.️

If I had another server, I could set up replication and have load balancing handled by Traefik on premise. The problem is that two local servers are likely to be affected by the same internet and electrical outages. Redundant compute, power, internet solutions are certainly rabbit holes I will be diving down in the future.

As always, everything is available on my Github:

{{< github repo="scottmckendry/BlogMaintenancePage" >}}
