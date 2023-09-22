---
title: "Building a Better Blog with Ghost"
date: 2023-01-10
tags: ["ghost", "traefik", "docker", "blog"]
summary: "My experience building a minimal, lightweight blog using Ghost 👻"
url: "/ghost-blog/"
---

I recently decided to have another crack at blogging. Having gone through the pain of setting up a WordPress site in the past and not enjoying the process of writing on the platform at all, ultimately giving up, I knew I had to find an alternative. Enter Ghost.

![img](/img/ghost-blog/ghost-logo-dark.webp)

Ghost appeared to be the standout candidate. It ticked all the boxes.

- Self-hosted ✅
- Open Source ✅
- Fast & lightweight ✅
- Beautiful & Intuitive ✅

I didn't care for the heavy focus on monetized content and building a subscriber base. But the idea of never having to mess with WordPress plugins or page editors was enough for me.

### Hosting

I opted to host Ghost in a docker container on my home server. [Ghost's Docker image](https://hub.docker.com/_/ghost?ref=scottmckendry.tech) is well-supported and well-documented. Not to mention incredibly lightweight and fast. For anyone looking to self-host, docker is the way to go.

I'm using [Traefik](https://scottmckendry.tech/traefik-ssl-all-the-things/) for routing and SSL. Meaning I can host multiple blogs and other services if I so choose, all from one public IP.

![](/img/ghost-blog/traefik.webp)

Ghost also offers its own [hosting service](https://ghost.org/pricing/?ref=scottmckendry.tech), if self-hosting isn't your thing.

### Stripping Back the Fluff

After flitting through a few templates, I knew I was going to have to make some edits to get the look I was after. My blog is based on the [Edition](https://ghost.org/themes/edition/?ref=scottmckendry.tech) theme. Though looking at the demo, you might not believe it.

Again, because I wasn't really focused on building a subscriber base, I decided to remove most of the home page interface, leaving just a search button.

Most of this could just by editing the Handlebar (.hbs) files in the theme's directory and commenting out elements I didn't want. I removed the email field on the cover image by commenting out these lines in the **cover.hbs** file:

```hbs
{{#if @site.members_enabled}}
    {{#unless @site.members_invite_only}}
        {{#unless @member}}
            {{!-- <form class="form-wrapper cover-form" data-members-form>
                <input class="auth-email" type="email" data-members-email placeholder="Your email address" required="true"
                    autocomplete="false">

                <button class="form-button" type="submit" aria-label="Submit">
                    <span class="default">Subscribe</span>
                    <span class="loader">{{> "icons/loader"}}</span>
                    <span class="success">Email sent</span>
                </button>
            </form> --}}
        {{/unless}}
    {{/unless}}
{{/if}}
```
I also did the same for the Sign In and Subscribe buttons in the navigation (default.hbs):

```hbs
<div class="gh-head-actions">
    {{#unless @site.members_enabled}}
        {{^match @custom.navigation_layout "Stacked"}}
            <button class="gh-search gh-icon-btn" data-ghost-search>{{> "icons/search"}}</button>
        {{/match}}
        {{else}}
            <button class="gh-search gh-icon-btn" data-ghost-search>{{> "icons/search"}}</button>
        {{#unless @member}}
            {{#unless @site.members_invite_only}}
                {{!-- <a class="gh-head-btn gh-btn gh-primary-btn" href="#/portal/signup" data-portal="signup">Subscribe</a> --}}
            {{else}}
                {{!-- <a class="gh-head-btn gh-btn gh-primary-btn" href="#/portal/signin" data-portal="signin">Login</a> --}}
            {{/unless}}
            {{else}}
                <a class="gh-head-btn gh-btn gh-primary-btn" href="#/portal/account" data-portal="account">Account</a>
        {{/unless}}
    {{/unless}}
</div>
```



### Adding Post Comments

Up until recently, Ghost required a third-party integration for comments. This is [no longer the case](https://ghost.org/changelog/native-comments//?ref=scottmckendry.tech) as of August 2022.

![img](/img/ghost-blog/comments.webp)

Strangely, comments are not enabled by default. I turned these on from the Admin interface under Settings → Membership.

### Code Snippet Syntax Highlighting

Ghost has code snippets out of the box but no syntax highlighting. It's not much to look at:

![img](/img/ghost-blog/snippet.webp)

I've supplemented highlighting using [Prism](https://prismjs.com/?ref=scottmckendry.tech). Here's the same code again, but with Prism enabled:

```cs
using System;

namespace Program 
{
    public class Program
    { 
        static void Main(string[] args)
        {
            Console.WriteLine("Hello, World!");
        }
    }
}
```

Prism is lightweight JS and CSS that can be injected into your Ghost site. From Settings → Code Injection, I added the following lines to the Site Header:

```html
<!--Prism Tomorrow Night Theme-->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" integrity="sha512-vswe+cgvic/XBoF1OcM/TeJ2FW0OofqAVdCZiEYkd6dwGXthvkSFWOoGGJgS2CW70VK5dQM5Oh+7ne47s74VTg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
<!--Prism TreeView Plugin-->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/treeview/prism-treeview.min.css" integrity="sha512-T2070kymkL/92LGEdTHzxTu6cHJjQI66uq8uJ768/iOs6M7yTceI2YcHFh2BHUcqbsDUFn4t9iaXNYAbmUKp8A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
<!--Prism Toolbar Plugin-->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/toolbar/prism-toolbar.min.css" integrity="sha512-Dqf5696xtofgH089BgZJo2lSWTvev4GFo+gA2o4GullFY65rzQVQLQVlzLvYwTo0Bb2Gpb6IqwxYWtoMonfdhQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
```

And the following to the Site Footer:

```html
<!--Prism Core-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.28.0/components/prism-core.min.js" integrity="sha512-9khQRAUBYEJDCDVP2yw3LRUQvjJ0Pjx0EShmaQjcHa6AXiOv6qHQu9lCAIR8O+/D8FtaCoJ2c0Tf9Xo7hYH01Q==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<!--Prism Autoloader Plugin-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.28.0/plugins/autoloader/prism-autoloader.min.js" integrity="sha512-fTl/qcO1VgvKtOMApX2PdZzkziyr2stM65GYPLGuYMnuMm1z2JLJG6XVU7C/mR+E7xBUqCivykuhlzfqxXBXbg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<!--Prism TreeView Plugin-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/treeview/prism-treeview.min.js" integrity="sha512-uMvB4vWdwV+sAcjP68GzxHkfyBg71sDCuhY+TYGD994ptnsfMxgb6Zs3AHKEuVieOKvbaO+c+6WGduVKahLJUg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<!--Prism Toolbar Plugin-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/toolbar/prism-toolbar.min.js" integrity="sha512-st608h+ZqzliahyzEpETxzU0f7z7a9acN6AFvYmHvpFhmcFuKT8a22TT5TpKpjDa3pt3Wv7Z3SdQBCBdDPhyWA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<!--Prism Clipboard Plugin-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/-to-clipboard/prism--to-clipboard.min.js" integrity="sha512-/kVH1uXuObC0iYgxxCKY41JdWOkKOxorFVmip+YVifKsJ4Au/87EisD1wty7vxN2kAhnWh6Yc8o/dSAXj6Oz7A==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
```

Which yields the 'pretty' code snippets that are peppered through this post.<br>
Now, all that's left to do is start writing!
