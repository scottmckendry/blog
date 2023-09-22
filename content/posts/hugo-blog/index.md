---
title: "Moving My Blog From Ghost to Hugo"
date: 2023-09-21
tags: [ "blog", "hugo" ]
summary: "I moved my blog... again. Here's my experience moving from Ghost to Hugo ✈️"
---

If you've visited before, you may have noticed that my blog looks a little different. Over the last few days, I migrated my blog and all of its content from Ghost to Hugo. 

I've been using Ghost since the start of this year. In fact, my very first post was about my experience setting up Ghost.

{{< article link="/ghost-blog/" >}}

Since then, I've written several posts and enjoyed the experience. But it was time for a change. Having recently picked up Go, I decided to give Hugo a try.

## Why Hugo?
I knew I wanted to use a static site generator. I wanted the convenience of writing my posts locally in Markdown and having them automatically pushed to my site. After comparing a few options like [Jekyll](https://jekyllrb.com/) and [Gatsby](https://www.gatsbyjs.com/), I decided to go with Hugo.

Some things that stood out to me the most:
- **Speed** - Hugo is written in Go and is _fast_. It's one of the fastest static site generators available.
- **Ease of Use** - Hugo is easy to install and use. It's also easy to customize and extend.
- **Community** - Hugo has a large community of users and contributors. There are a lot of themes and plugins available.

### Automated Deployment
As I briefly touched on above, I wanted to be able to write my posts locally and have them automatically pushed to my site. My entire blog is hosted in a GitHub repository. I use GitHub Actions to build and deploy my site to GitHub Pages.

Anytime I push a commit to the `main` branch, GitHub Actions will build my site and save the generated output as an artefact. The artefact is then deployed directly to GitHub Pages using the [`deploy-pages`](https://github.com/actions/deploy-pages) action.

For more details, check out this guide from Hugo's documentation:

{{< button href="https://gohugo.io/hosting-and-deployment/hosting-on-github/" >}}
Hugo: Host on GitHub Pages
{{< /button >}}

### Editing Experience
At first, I was a big fan of Ghost's editor. It's a simple, clean, and distraction-free writing experience. But over time, I started finding it a bit limiting. As a very specific example, you cannot nest an unordered list inside an ordered list without using the built-in Markdown card. Which in itself is kind of limiting.

There was also no native support for GitHub repository links. I had to use custom HTML to embed a GitHub repository in a post. With the theme I'm using now, I can simply use a shortcode to embed a GitHub repository. Like the one below:

{{< github repo="scottmckendry/windots" >}}

Also, having recently picked up Neovim, I found it much easier to write my posts in Markdown using Vim motions. I can use my favourite plugins and key bindings to write my posts. I had a system, in place for this with Ghost, but it required a significant amount of double-handling to move my Markdown draft into the Ghost Editor for publishing.

### Performance
Hosting my blog on GitHub Pages means that I don't have to worry about the performance of my site. GitHub Pages is fast and reliable. Because I was self-hosting Ghost, the performance of my site was entirely dependent on the performance of my server.
Here's a comparison of the performance of my site before and after the migration:
![before](/img/hugo-blog/before.webp "Before")
![after](/img/hugo-blog/after.webp "After")

### Maintainability
There's no doubt that self-hosting ghost is a lot more work. Along with the main Ghost container, I also had to maintain a MySQL database. Because the content was stored directly in the database, I had to take regular backups.

With Hugo, I don't have to worry about any of that. My entire blog is stored in a GitHub, so my 'backup' is just a `git push` away. I don't have to worry about maintaining a database or any other infrastructure.

If hugo suddenly dropped off the face of the earth, I could easily switch to another static site generator, taking all of my content with me. I'm not locked into a specific platform.

## Migration Options
I opted to migrated all of my content manually. I didn't have a lot of posts to migrate, so it wasn't a big deal. I simply copied the content of each post from Ghost and pasted it into a new Markdown file adding in the necessary front matter as I went.

For those with a lot of posts, there are a few options available. The [Ghost to Hugo](https://github.com/jbarone/ghostToHugo/) tool appears to be the most popular but isn't actively maintained. The last commit was in 2021.

## Thanks
Thank you to [Nuno Coração](https://nunocoracao.com/) for his work on the fatastic [Blowfish theme](https://blowfish.page/). It's truly a testament to the power of Hugo and is incredibly well documented and easy to customize.

## Conclusion
I'm really happy with the move to Hugo. I'm looking forward to writing more posts and continuing to customize my blog. If you're interested in the theme I'm using, you can find it on GitHub:

{{< github repo="nunocoracao/blowfish" >}}

You can also find the source code for my blog here:

{{< github repo="scottmckendry/blog" >}}
