---
title: 'How to "Actually" Audit SharePoint Permissions'
date: 2023-12-29
tags: ["powershell", "sharepoint"]
summary: "A PowerShell script to audit SharePoint permissions and export the results to a CSV file."
url: "/sp-permissions-audit/"
---

I was recently tasked with auditing the permissions for a few users in a SharePoint Online tenancy. SharePoint does not ship with any built in capability (that I'm aware of) to perform something like this at a tenant level.

Sure, you can use the "Check Permissions" feature on a site, but this is a manual process and doesn't scale well. I needed a way to do this for all sites in the tenancy, and export the results to a CSV file.

For anyone who has worked with SharePoint permissions before, you'll know that it's not as simple as just checking the permissions on a site. SharePoint's permissions are hierarchical, so you need to check the permissions on the site, and then recursively check the permissions on all lists, libraries and items. There's also sharing links and Security/365 Groups to contend.

It's a bit of a mess.

## Common Pitfalls when Auditing SharePoint Permissions

-   A user context is used to check permissions. This requires the user to have access to the site in order to check the permissions. This is not ideal if you're trying to audit permissions for a user who has left the company.
-   Only top-level groups are checked. SharePoint's permissions are hierarchical, so you need to check the permissions on the site, and then recursively check the permissions on all lists, libraries and items.
-   Sharing Links are ignored. The 'Share' button in SPO is incredibly enticing for the unassuming user. It's easy to share a document with a user or group without realising the implications. These links are not visible in the UI, so they are often overlooked when auditing permissions.

## The Solution

There are a few solutions out there that attempt to solve this problem, but most are either outdated, use a deprecated authentication flow or just outright don't work.

I decided to write my own solution using modern certificate-based authentication and the SharePoint PnP PowerShell module.

You can find the script on my GitHub:

{{< github repo="scottmckendry/sp-permissions-audit" >}}

Hopefully this helps someone else out there who is trying to solve the same problem!

If you have any questions or suggestions, please feel free to raise an issue on the GitHub repo or reach out to me on one my socials.
