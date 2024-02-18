---
title: "Custom Prompt Status Icons Using Starship"
date: 2024-02-18
tags: ["windows", "linux", "bash", "powershell"]
summary: "A deep dive into environment variables, background jobs, and optimisation"
url: "/dotfile-icons/"
---

My dotfiles are a labour of love. With over [200 commits](https://github.com/scottmckendry/windots/commits/main), you could say that I'm a bit obsessed with tweaking and customising things. The closest approximation to my relationship with my setup can be summed up by the following quote:

> Just one more thing...<br>
> — Steve Jobs

The latest "one more thing" I've been working on is a couple of custom status icons for my prompt. Specifically to show two things:

1. Pending Software Updates
2. Changes to my dotfiles that have not been pulled to my local machine

I use [Starship](https://starship.rs/) as my prompt, so I'll be showing you how to set up custom status icons using it. If you use a different prompt, you can still follow along and adapt the steps to your specific use case.

## Requirements

I had two main requirements for this project:

1. **Cross-Platform**: My starship configuration is shared across Windows and Linux, so the solution had to work on both.
2. **Fast**: I didn't want to slow down my prompt with a bunch of slow scripts. Any noticeable delay would be a deal-breaker.

Little did I know that these requirements would lead me down a rabbit hole of environment variables, background jobs, and optimisation. But I'm getting ahead of myself. Let's start with the basics.

## Starship Environment Variables

Starship allows you to display the value of environment variables in your prompt. This is perfect for our use case, as we can set environment variables to the status of our pending updates and dotfile changes.

We can configure Starship to display the value of an environment variable by adding a new section to our `starship.toml` file. Here's an example of how to display the value of the `SOFTWARE_UPDATE_AVAILABLE` & `DOTFILES_UPDATE_AVAILABLE` environment variables:

```toml
# ./config/tarship.toml
[env_var.SOFTWARE_UPDATE_AVAILABLE]
variable = 'SOFTWARE_UPDATE_AVAILABLE'
format = '[$env_value]($style)'
default = ''
style = 'bold cyan'

[env_var.DOTFILES_UPDATE_AVAILABLE]
variable = 'DOTFILES_UPDATE_AVAILABLE'
format = '[$env_value]($style)'
default = ''
style = 'bold cyan'
```

Now, we can set the value of these variables to a custom status in our Bash and PowerShell profiles.

```bash
# ~/.bashrc
export SOFTWARE_UPDATE_AVAILABLE="📦 "
```

```powershell
# $PROFILE.CurrentUserAllHosts
$env:SOFTWARE_UPDATE_AVAILABLE = "📦 "
```

This results in the following prompt:

![img](/img/dotfile-icons/prompt-example.png)

{{< alert icon=lightbulb >}}
I've used the 📦 emoji to represent pending software updates since nerd font icons don't render on the web. You can use any emoji or text that you like.

The Nerd font icons I am using can be found [here](https://www.nerdfonts.com/cheat-sheet). Specifically, `nf-cod-package` and `nf-md-account_sync_outline`
{{</ alert >}}

Great! We've got the environment variables displaying in our prompt. But in its current state, the value of these variables will never change.

We want these to display dynamically based on the actual status of our system. **This is where the fun begins.**

## Dotfile Changes (Bash)

Let's start with the easier of the two. Here's the basic logic we want to implement:

1. Navigate to the dotfiles directory.
2. Run `git fetch && git status` to check for any upstream changes.
3. If there are changes, set the `DOTFILES_UPDATE_AVAILABLE` environment variable to a custom status.

A simple implementation in Bash might look like this:

```bash
# ~/.bashrc
export DOTFILES_UPDATE_AVAILABLE="🔀 "

function checkDotfileChanges() {
  cd ~/dotfiles
  updates=$(git status | grep -q "behind" && echo "true" || echo "false")
  if $updates; then
    export DOTFILES_UPDATE_AVAILABLE="🔀 "
  else
    export DOTFILES_UPDATE_AVAILABLE=""
  fi
}

checkDotfileChanges
```

This works, but it adds unnecessary overhead to our prompt. The function `checkDotfileChanges` must complete before the prompt is displayed, which can slow things down, especially if any significant changes have been made upstream.

We can fix this by running the function in the background by adding `&` to the end of the function call. This will allow the prompt to display immediately while the function runs in the background.

```bash
# ~/.bashrc
function checkDotfileChanges() {
...
}

checkDotfileChanges &
```

Great! Much faster. But where's our icon gone? It turns out running a function in the background doesn't allow it to modify the environment variables of the parent shell.

![img](https://c.tenor.com/CuKhpZPIxrIAAAAd/tenor.gif)

I tried a few approaches, but ultimately I could not find any suitable solution for achieving this in Bash.

However, the child process *could* modify a local file, which the parent process could then read. So instead of setting the environment variable directly, we can write code to export the variable to `.bash_profile`. I can then source this file as part of the prompt command. This is a bit of a hack, but it works.

```bash
# ~/.bashrc
# Check for updates in dotfiles
function checkDotfilesUpdate() {
 cd ~/git/dots
 updates=$(git status | grep -q "behind" && echo "true" || echo "false")
 if $updates; then
  sed -i "s/DOTFILES_UPDATE_AVAILABLE=.*/DOTFILES_UPDATE_AVAILABLE=\"🔀 \"/" ~/.bash_profile
 else
  sed -i "s/DOTFILES_UPDATE_AVAILABLE=.*/DOTFILES_UPDATE_AVAILABLE=\"\"/" ~/.bash_profile
 fi
}

checkDotfilesUpdate &

# Use the prompt command to source the bash profile
PROMPT_COMMAND='. ~/.bash_profile;'$PROMPT_COMMAND
```

This updates any environment variables declared in `.bash_profile` before the prompt is displayed. A bit of a hack, but it works!

![img](https://c.tenor.com/hu_FT1OesQwAAAAC/tenor.gif)

## Pending Software Updates (Bash)

We can take our learnings from the dotfile changes and apply them to the pending software updates. Here's the basic logic we want to implement:

1. Update our package repositories to get the latest package information.
2. Check for any pending updates.
3. If there are updates, set the `SOFTWARE_UPDATE_AVAILABLE` environment variable to a custom status.

Following suit from the dotfile changes, we can run this function in the background and update the `.bash_profile` file.

```bash
# ~/.bashrc
function checkSoftwareUpdates() {
  sudo apt update
  updates=$(sudo apt list --upgradable | wc -l)
  if [ $updates -gt 1 ]; then
    sed -i "s/SOFTWARE_UPDATE_AVAILABLE=.*/SOFTWARE_UPDATE_AVAILABLE=\"📦 \"/" ~/.bash_profile
  else
    sed -i "s/SOFTWARE_UPDATE_AVAILABLE=.*/SOFTWARE_UPDATE_AVAILABLE=\"\"/" ~/.bash_profile
  fi
}

checkSoftwareUpdates &

# Use the prompt command to source the bash profile
PROMPT_COMMAND='. ~/.bash_profile;'$PROMPT_COMMAND
```

Opening a new terminal, there's an immediate issue. The `sudo` command requires a password, which will cause the prompt to hang until the command is completed.

We can fix this by adding `sudo` to the `NOPASSWD` list in the `/etc/sudoers` file. This will allow the `apt` command to run without a password prompt.

```bash
# /etc/sudoers
# Add the following line to the end of the file
username ALL=(ALL) NOPASSWD: /usr/bin/apt
```

Cool, first problem solved. But now we have a new problem. For some reason, the `apt` command exhibits strange behaviour when run in the background. To the point where the terminal would become ***unusable***. Redirecting output to `/dev/null` didn't help.

![img](https://c.tenor.com/L66gfL1eMUsAAAAC/tenor.gif)

Like the dotfile changes, I spent a while banging my head against the wall trying to find a solution. Enter `screen`.

[GNU Screen](https://www.gnu.org/software/screen/) is a terminal multiplexer that allows you to run multiple terminal sessions within a single window. It also has the ability to run commands in the background.

We can use `screen` to run the `apt` command in the background without any of the strange behaviour. Here's how we can do that:

```bash
# ~/.bashrc
function checkUpdates() {
  screen -S apt -d -m sudo apt update
  # wait for apt to finish
  while [ $(screen -ls | grep -c apt) -gt 0 ]; do
     sleep 1
  done
 updates=$(apt list --upgradable 2>/dev/null | wc -l)
 if [ $updates -gt 1 ]; then
        sed -i "s/SOFTWARE_UPDATE_AVAILABLE=.*/SOFTWARE_UPDATE_AVAILABLE=\"📦 \"/" ~/.bash_profile
    else
        sed -i "s/SOFTWARE_UPDATE_AVAILABLE=.*/SOFTWARE_UPDATE_AVAILABLE=\"\"/" ~/.bash_profile
    fi
}
...
```
