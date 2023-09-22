---
title: "How I Sync My Dotfiles Between Windows and Linux Using GitHub Actions"
date: 2023-09-14
tags: ["windows", "linux", "github", "dotfiles"]
summary: "Dotfile Harmony: GitHub Actions in 'Action' 🚀"
url: "/how-i-sync-my-dotfiles-between-windows-and-linux-using-github-actions/"
---

I love tinkering with my operating system and tools. I find it a fun way to spend my time, and it helps me stay "_productive_". However, I don't like rework. I hate having to make the same changes to my configuration files on multiple machines.

In my world, it's a mix of Windows and Linux, two worlds with their own unique flavours. **But I have a goal**: keep my configuration and settings as harmonious as possible. My current solution is to maintain two separate repositories:

- [Windots](https://github.com/scottmckendry/windots?ref=scottmckendry.tech) – Windows
- [Dots](https://github.com/scottmckendry/dots?ref=scottmckendry.tech) – Linux

## The Problem

Not everything has to be identical. I'll give you an example—I use Alacritty on Linux, but on Windows 11, the default Windows Terminal does the trick. So, there's no need to sync Alacritty with my Windots repo, right? Similarly, I don't need to duplicate my Windows Terminal configuration in my Dots repo.

I use Neovim on both platforms with an identical config. I want changes to be automatically mirrored between the two repos. I _could_ just copy the files every time I make a change. But that's boring and error-prone.

## The Solution

I came across this [GitHub action](https://github.com/dmnemec/copy_file_to_another_repo_action?ref=scottmckendry.tech) that looked promising. It copies files/folders from one repo to another, including logic to only copy files that have changed. Perfect!

Here's how I set it up for my Windows and Linux dotfiles repositories:

**1. Setting up a Personal Access Token (PAT)**

To allow the GitHub action to push changes to the destination repository, you'll need to create a Personal Access Token (PAT). Follow these steps to generate and configure your PAT:

- Navigate to your [Personal Access Tokens](https://github.com/settings/tokens?type=beta&ref=scottmckendry.tech) page in GitHub Developer Settings.
- Click on **Generate new token**.
- Give your token a name and select the two repositories you want to keep in sync.

![img](/img/dotfile-sync/repos.webp)

Assign the following **Repository Permissions**:

- **Contents** – Read and write
- **Actions** – Read only
- **Metadata** – Read only

After configuring the permissions, click **Generate token**, and copy the token to your clipboard.

In each of your repositories (Windows and Linux), add the token as a [secret](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions?ref=scottmckendry.tech#creating-secrets-for-a-repository). Name the secret `SYNC_TOKEN`.

**2. GitHub Action Configuration**

With the PAT in place, you can now set up the GitHub action to automate dotfile synchronization. Here's the configuration I used for both repositories:

```yaml
on:
  push:
    branches:
      - main

name: Sync to dots

jobs:
  copy-file:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        
      - name: Sync Neovim
        uses: dmnemec/copy_file_to_another_repo_action@main
        env:
          API_TOKEN_GITHUB: ${{ secrets.SYNC_TOKEN }}
        with:
          source_file: "nvim/"
          destination_repo: "scottmckendry/dots"
          destination_folder: "/" 
          user_email: "39483124+scottmckendry@users.noreply.github.com"
          user_name: "Scott McKendry"
          commit_message: "${{ github.event.head_commit.message }}\n[skip ci]\nAutomated sync from scottmckendry/Windots"
          git_server: "github.com"
```

Copy

A few points to note about the config:

- The `commit_message` parameter is set to the commit message of the triggering commit, ensuring consistency across both repositories.
- Including `[skip ci]` in the commit message is crucial to prevent the action from triggering repeatedly when the commit is pushed to the destination repository, avoiding an infinite loop. I've also included a note indicating the commit's origin.

## The Result

Now when I make a change to my Neovim config on either platform, the pushed changes are mirrored in both repositories, commit message and all! I can make changes on either platform without worrying about manually copying files. Mental load reduced! 🚀

## The Future

More and more of my config is becoming platform-agnostic. To add another file or folder in the sync, I just need to add another step to the workflow.

You can see the action "_in action_" below. Let me know what you think!

{{< github repo="scottmckendry/Windots">}}
