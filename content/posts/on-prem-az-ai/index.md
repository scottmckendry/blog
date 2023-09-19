---
title: "Monitoring On-Premise Web Applications with Azure App Insights"
date: 2023-02-05T00:00:00-00:00
tags: ["azure"]
summary: "Improving upon my web failover solution with the help of App Insights and Availability Monitoring 📊"
url: "/web-monitoring/"
---

In my [recent post](https://scottmckendry.tech/maintenance-web-app-azure/) about outages and failover, I went down the rabbit hole of trying to set up a free solution using Azure that could hold the fort while I sorted out the issues at my end.

I got most of the way there but it was missing two things:

-   Notifications/Alerts when the site became unavailable
-   More responsive failover

We can address both of these with #Azure Application Insights.

### Availability Tests

[Availability Tests](https://learn.microsoft.com/en-us/azure/azure-monitor/app/availability-overview?ref=scottmckendry.tech) can be used to monitor service availability. In this implementation, I've configured a URL Ping Test. This not only measures whether the endpoint is up but also the response time.

These can be created from an App Insights instance under **Availability** by selecting **\+ Add Classic test**.

![img](/img/on-prem-az-ai/availability-tests.webp)

Give the test a name, URL and adjust the Test Locations to your preference. Azure recommends at least 5.

![img](/img/on-prem-az-ai/availability-tests-2.webp)

### Alerts

A default Alert Rule is created with each availability test. Configured Alerts can be viewed from the ellipsis menu on the test:

![img](/img/on-prem-az-ai/alerts.webp)

Unless you have a particular use case, you should need to change the default criteria.

I've configured two Actions for my test:

-   Send the alert as a push notification to my phone
-   Start the runbook to initiate failover

### Push Notifications

From the Alert Edit form, I added a new **Action Group** by selecting **Manage action groups** and then **Create action group**.

After naming it, I could then select my notifications. Under Notification Type, I selected **Email/SMS message/Push/Voice** and picked out the following:

![img](/img/on-prem-az-ai/push-notifications.webp)

Now, when my website goes down, I'll get a notification on my phone within just a few minutes.

### Starting the Runbook

I added another Action group to this alert for my runbook. Azure has a built-in Action Type for Automation Runbooks. I configured mine to start the one I created in my previous post like this:

![img](/img/on-prem-az-ai/runbook-action.webp)

{{< alert icon=lightbulb >}}
Action Groups are designed to be reused. Try not to put too many Notifications or Actions in one Group. This is why I've created separate Action Groups for Push Notifications and the Runbook.
{{< /alert >}}

With this action in place, I've effectively halved my response time for failover. Nice!
