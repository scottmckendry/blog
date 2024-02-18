---
title: "Custom Prompt Status Icons Using Starship"
date: 2024-02-18
tags: ["dotfiles", "bash", "powershell"]
summary: "My attempt at minimal, *cross-platform* status icons for my terminal prompt 🔔"
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

Now I'm fairly certain this is a *"solved"* problem. There are probably a bunch of tools and scripts that can do this for me. But sometimes reinventing the wheel is more fun.

I had two main requirements for this project:

1. **Cross-Platform**: My starship configuration is shared across Windows and Linux, so the solution had to work on both.
2. **Fast**: I didn't want to slow down my prompt with a bunch of slow scripts. Any noticeable delay would be a showstopper.

Sounds simple enough, right? (foreshadowing 😈)<br>Let's get started.

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

![img](/img/dotfile-icons/prompt-example.webp)

{{< alert icon=lightbulb >}}
I've used the 📦 emoji to represent pending software updates since nerd font icons don't render on the web. You can use any emoji or text that you like.

The nerd font icons I am using can be found [here](https://www.nerdfonts.com/cheat-sheet). Specifically, `nf-cod-package` and `nf-md-account_sync_outline`
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
icons

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

[GNU Screen](https://www.gnu.org/software/screen/) is a terminal multiplexer that allows you to run multiple terminal sessions within a single window (like `tmux`). It also has the ability to run commands in the background. It can be installed with `sudo apt install screen`.

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

Et voila! We have a working solution for both dotfile changes and pending software updates in Bash.

## PowerShell

Over on the Windows side of things, we can use a similar approach to achieve the same result. Git is functionally the same on Windows, so we can use the same logic to check for dotfile changes.

In PowerShell, the equivalent of the `&` operator is `Start-Job`. This allows us to run a command in the background, which is perfect for our use case. However, I quickly found that this approach has the same issue as Bash. The child process cannot modify the environment variables of the parent process.

![img](https://c.tenor.com/s8hIm9KshIAAAAAd/tenor.gif)

That's where PowerShell's *secret weapon* comes in: `Start-ThreadJob`. It creates background jobs similar to `Start-Job`, but with one key difference: the jobs created run in separate threads within the local process.

Because of this, the job is able to share the same memory space as the parent process, allowing it to modify environment variables in the parent process. This is exactly what we need.

```powershell
# $PROFILE.CurrentUserAllHosts
# Check for Windots and software updates while prompt is loading
Start-ThreadJob -ScriptBlock {
    Set-Location -Path $ENV:WindotsLocalRepo
    $gitUpdates = git fetch && git status
    if ($gitUpdates -match "behind") {
        $ENV:DOTFILES_UPDATE_AVAILABLE = "`u{db86}`u{dd1b} "
    }
    else {
        $ENV:DOTFILES_UPDATE_AVAILABLE = ""
    }
} | Out-Null
```

The `Start-ThreadJob` command runs the `ScriptBlock` in the background, allowing the prompt to display immediately. I'm using `Out-Null` to suppress the output of `Start-ThreadJob`, which stops the prompt from displaying the created job information.

For the pending software updates, I wanted to be a bit more creative. I use both `winget` and `choco` to manage my software on Windows, so the solution needed to check both package managers. So I came up with something like this:

```powershell
# $PROFILE.CurrentUserAllHosts
# Check for Windots and software updates while prompt is loading
Start-ThreadJob -ScriptBlock {
    $wingetUpdatesString = winget list --upgrade-available
    $chocoUpdatesString = choco upgrade all --noop
    if ($wingetUpdatesString -match "upgrades available" -or $chocoUpdatesString -notmatch "can upgrade 0/") {
        $ENV:SOFTWARE_UPDATE_AVAILABLE = "`u{eb29} "
    }
    else {
        $ENV:SOFTWARE_UPDATE_AVAILABLE = ""
    }
} | Out-Null
```

This had the functionality I wanted, but similar to the Bash implementation, it had a noticeable effect on the usability of the terminal while the job was running.

*What is it with package managers and being obnoxious in the background?*

![img](https://c.tenor.com/2VdKxnQxcFcAAAAC/tenor.gif)

We have a solution for this, too. Taking inspiration from the `screen` approach in Bash, we can banish the `winget` and `choco` commands to their own isolated jobs and then await the results. This way, the main logic of the block runs in a separate thread, and the output of the `winget` and `choco` commands is retrieved via two isolated jobs. This sets the environment variable correctly and doesn't cause any lag (that I've noticed yet).

Here's the final implementation:

```powershell
Start-ThreadJob -ScriptBlock {
    $wingetUpdatesString = Start-Job -ScriptBlock { winget list --upgrade-available | Out-String } | Wait-Job | Receive-Job
    $chocoUpdatesString = Start-Job -ScriptBlock { choco upgrade all --noop | Out-String } | Wait-Job | Receive-Job
    if ($wingetUpdatesString -match "upgrades available" -or $chocoUpdatesString -notmatch "can upgrade 0/") {
        $ENV:SOFTWARE_UPDATE_AVAILABLE = "`u{eb29} "
    }
    else {
        $ENV:SOFTWARE_UPDATE_AVAILABLE = ""
    }
} | Out-Null
```

![img](https://c.tenor.com/2rAuZWSTScQAAAAC/tenor.gif)

## Updating the Prompt

Now that we have the icons set up, we need a way to get rid of them. The best way to do this is while actually updating our dotfiles or software. We can add a simple function to our `~/.bashrc` and `$PROFILE.CurrentUserAllHosts` to clear the environment variables when we run the update commands.

```bash
# ~/.bashrc
# Update software using apt
function updateSoftware() {
  sudo apt update
  sudo apt upgrade -y
  sed -i "s/SOFTWARE_UPDATE_AVAILABLE=.*/SOFTWARE_UPDATE_AVAILABLE=\"\"/" ~/.bash_profile
  . ~/.bash_profile
}

# Pull in latest dotfile updates and run setup
function updateDotfiles() {
  currentDir=$(pwd)
  cd ~/git/dots
  git pull
  ./setup.sh
  cd $currentDir
  sed -i "s/DOTFILES_UPDATE_AVAILABLE=.*/DOTFILES_UPDATE_AVAILABLE=\"\"/" ~/.bash_profile
  . ~/.bash_profile
}

alias us="updateSoftware"
alias up="updateDotfiles"
```

Aliases are a great way to make these commands easier to remember and use. We can do the same in PowerShell:

```powershell
function Update-Profile {
    <#
    .SYNOPSIS
        Downloads the latest version of the PowerShell profile from Github, updates the PowerShell profile with the latest version and reruns the setup script.
        Note that functions won't be updated, this requires a full restart. Alias: up
    #>
    Write-Verbose "Storing current working directory in memory"
    $currentWorkingDirectory = $PWD

    Write-Verbose "Updating local profile from Github repository"
    Set-Location $ENV:WindotsLocalRepo
    git pull | Out-Null

    Write-Verbose "Rerunning setup script to capture any new dependencies."
    Start-Process wezterm -Verb runAs -WindowStyle Hidden -ArgumentList "start --cwd $PWD pwsh -Command .\Setup.ps1"

    Write-Verbose "Reverting to previous working directory"
    Set-Location $currentWorkingDirectory

    Write-Verbose "Re-running profile script from $($PROFILE.CurrentUserAllHosts)"
    .$PROFILE.CurrentUserAllHosts
}

function Update-Software {
    <#
    .SYNOPSIS
        Updates all software installed via Winget & Chocolatey. Alias: us
    #>
    Write-Verbose "Updating software installed via Winget & Chocolatey"
    Start-Process wezterm -Verb runAs -WindowStyle Hidden -ArgumentList "start -- pwsh -Command &{winget upgrade --all && choco upgrade all -y}"
    $ENV:SOFTWARE_UPDATE_AVAILABLE = ""
}

Set-Alias -Name up -Value Update-Profile
Set-Alias -Name us -Value Update-Software
```

Notice that I'm using `Start-Process` with the `runAs` verb to run the update commands with elevated privileges. This only gives us a UAC prompt once, and doesn't require us to run our main terminal session as an administrator.

I use `wezterm` as my chosen emulator on Windows, but this can be replaced with `wt` or `pwsh` for Windows Terminal or PowerShell, respectively.

As always, the full source code can be found on my GitHub:

{{< github repo="scottmckendry/windots" >}}

<br>

{{< github repo="scottmckendry/dots" >}}
