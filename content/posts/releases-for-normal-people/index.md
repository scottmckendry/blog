---
title: "Releases for Normal People"
date: 2025-01-18
tags: ["DevOps", "AI"]
summary: "A technical approach to non-technical release notes"
url: "/releases-for-normal-people/"
---

Release notes are a crucial communication tool between development teams and users. But creating good ones - especially for non-technical audiences - can be challenging.

The majority of my personal projects are intended for an audience that is mostly technical. Most run in a terminal, are open-source, and are intended for like-minded engineers.

I've never had any issues with the release process for these projects. Generally, I expect my terse commit messages to translate well into the published notes in each release. I also trust that my users have the know-how (and initiative) to dig into a commit diff if more context is required.

However, I was recently thinking about releases for closed-source products, aimed at less technical audiences. In these situations, the terse [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) style bulleted notes don't translate as well.

![funny_words](/img/releases-for-normal-people/funny_words.webp)

## Why bother?

Just because the audience is non-technical, doesn't mean they are immune to change. In fact, the opposite is usually true. Many organizations have entire teams dedicated to change management, and releases (especially in SaaS) are _the_ most common source of change when it comes to product.

Release notes are a great medium for communicating these changes and showcasing new features. They represent both **return on investment** for the business & **value for money** to your customers. So getting them right matters.

## The problem

The problem with release notes is that they are often written by developers, for developers. Changelogs are often used in place of release notes, and are generally not user-friendly.

A changelog is a technical document that lists changes between versions. It is often used to communicate changes to developers, and is not intended for end-users. An end user doesn't care about the technical details of a release. They care about how it affects them, and how it makes their life easier.

![worthless](/img/releases-for-normal-people/worthless.webp)

## I'll write it myself

**Why?** In the age of automation & AI, why would you act as a bottleneck to your own process? All of the information required to write these notes is encoded in your project's `.git` folder. All we need to do is tease it out.

Let's look at how we can automate this process using existing tools and AI.

## Start with commit messages

The [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) style provides an excellent foundation for structured commit messages that can later be transformed into user-friendly notes.

However, working with a team of developers, it can sometimes be difficult to achieve consensus and consistency. Tools can also get in the way - for example, Azure DevOps prefixes PRs with _"Merge PR X:"_, which conflicts with the conventional commit style.

To combat this, I've been working on an extension:

{{< github repo="scottmckendry/commitscribe">}}

It's designed to run on every commit in your default branch, and re-write the commit message in the conventional commit style. It analyses the diff as well as the original commit message to provide a descriptive (and context-aware) commit message.

> Original commit message:
>
> ```
> Merge PR 3: Add support for YAML output
> ```
>
> After processing with commitscribe:
>
> ```
> feat(cmd): add support for YAML output
>
> Adds a new flag to the `cmd` command to allow for YAML output. Also includes new tests for the feature.
> ```

## Change Logs

Now that we have a consistent commit message style, we can start to generate release notes. The first step is to generate a changelog.

No need to reinvent the wheel here. There are plenty of tools that can generate a changelog from your commit history. For GitHub projects, I wholeheartedly recommend [release-please](https://github.com/googleapis/release-please). For Azure DevOps, I selected semantic-release:

{{< github repo="semantic-release/semantic-release">}}

## Providing context

We now have a changelog that represents our current release, but we've lost some important context along the way.

- **Commit bodies** - These are stripped out by most changelog generators, but can provide important context for a change.
- **Linked issues** - Issue/workitem IDs are often included, but the content of the issue is not. Issues can provide important information about the feature or bug fix, often from a non-technical perspective.

Introducing another tool:

{{< github repo="scottmckendry/cl-parse">}}

Cl-parse accepts a changelog as an input, and outputs structured data containing the extra information we need.

Consider the following changelog:

> [0.4.0](https://github.com/scottmckendry/cl-parse/compare/v0.3.0...v0.4.0) (2025-01-14)
>
> Features
>
> - **cmd:** `format` option with new YAML & TOML outputs ([7ffb283](https://github.com/scottmckendry/cl-parse/commit/7ffb283))
> - **origin:** add support for github issue lookup ([539c4cd](https://github.com/scottmckendry/cl-parse/commit/539c4cd)), closes [#2](https://github.com/scottmckendry/cl-parse/issues/2)

Running this through cl-parse will output the following:

```yaml
version: 0.4.0
date: 2025-01-14T00:00:00Z
compareUrl: https://github.com/scottmckendry/cl-parse/compare/v0.3.0...v0.4.0
changes:
    Features:
        - description: "**cmd:** `format` option with new YAML & TOML outputs"
          commit: 7ffb283
        - description: "**origin:** add support for github issue lookup"
          commit: 539c4cd
          commitBody: "adds new flag --fetch-item-details to fetch related items\n\nResolves #2"
          relatedItems:
              - number: 2
                title: "Feature: Programatically Fetch content from PRs and Issues"
                body: "Add an option to support the lookup of PRs and issues..."
```

It may look confusing at first, but this is ripe for automating with LLMs.

## The result

Passing this into a model with a simple prompt, we can generate release notes that are both informative and user-friendly.

> **What's New in Version 0.4.0 (January 14, 2025)**
>
> New Features
>
> - More Output Formats
>     - You can now export your changelog in YAML and TOML formats, giving you more flexibility in how you view and share your changes.
> - Smarter GitHub Integration
>     - The tool now connects directly to GitHub to fetch details about issues and pull requests. This means you'll get richer, more detailed information about changes without having to look them up manually.
>
> This release makes the tool both more versatile with its new export formats and smarter with its GitHub integration, helping you better understand the changes in your projects.

## Implementation

To put this into practice, you'll need:

1. A consistent commit message format (using tools like commitscribe)
2. A changelog generator (release-please or semantic-release)
3. A way to extract additional context (cl-parse)
4. An LLM to transform the technical content into user-friendly notes

These components can be chained together in your CI/CD pipeline to automate the entire process.

## Conclusion

Roll all of this up into a CI/CD pipeline, and you have a fully automated release process that generates user-friendly release notes. Not only does this save time for developers, but it ensures your users stay informed and engaged with your product's evolution through clear, accessible communication.
