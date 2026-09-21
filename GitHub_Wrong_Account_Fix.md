# How I Fixed Your `git push -u origin main` Problem

You had **2 different identities mixed up**. Git was trying to push to
`connectnexora/delete1` but authenticating as `vyankateshsarje`.

------------------------------------------------------------------------

## 1. How I Identified the Wrong Account

I ran:

``` powershell
git push -u origin main
```

You got:

``` text
remote: Permission to connectnexora/delete1.git denied to vyankateshsarje.
fatal: unable to access 'https://github.com/connectnexora/delete1.git/': The requested URL returned error: 403
```

### Key clue

-   `denied to vyankateshsarje` = the authenticated GitHub account was
    `vyankateshsarje`.
-   The repository owner was `connectnexora`.
-   `403` means GitHub recognized the account but that account did not
    have permission to push.

I also verified that the repository existed and was public/empty.
`git ls-remote` worked for reading, while pushing failed.

**Conclusion:** read access was working, but write access was denied
because the wrong GitHub account was authenticated.

------------------------------------------------------------------------

## 2. How I Checked Your Git Configuration

I ran:

``` powershell
git status
git branch -vv
git remote -v
git log --oneline -5
git config --get-regexp "^(remote|branch|user)"
```

What I saw:

``` text
On branch main
nothing to commit, working tree clean
* main d456489 first commit
origin https://github.com/connectnexora/delete1.git (fetch)
origin https://github.com/connectnexora/delete1.git (push)
user.name connectnexora
remote.origin.url https://github.com/connectnexora/delete1.git
```

This meant:

-   Branch = `main`
-   Remote = `origin`
-   Repository = `connectnexora/delete1`
-   There was already a commit.
-   The Git remote was already configured correctly.

So there was **no need to redo**:

``` powershell
git init
git remote add origin ...
```

### To check yourself

``` powershell
git config --global user.name
git config --global user.email
git config --list
git remote -v
```

------------------------------------------------------------------------

# 3. Four Different Things --- Don't Mix Them

## 1. Git username/email

Example:

``` powershell
git config --global user.name "connectnexora"
git config --global user.email "you@email.com"
```

These are labels attached to your Git commits.

Think of them as **writing your name on a letter**.

They do **not** log you into GitHub.

------------------------------------------------------------------------

## 2. GitHub account

This is the actual account on GitHub.

For example:

``` text
connectnexora
vyankateshsarje
```

These are different GitHub accounts.

------------------------------------------------------------------------

## 3. GitHub authentication credential

This is the credential/token/OAuth login stored on your computer that
proves:

> "I am this GitHub account."

This is what GitHub checks when you push.

------------------------------------------------------------------------

## 4. Repository remote URL

Example:

``` text
https://github.com/connectnexora/delete1.git
```

This tells Git **where to send the code**.

The owner in this example is:

``` text
connectnexora
```

------------------------------------------------------------------------

# 4. Why Changing `user.name` / `user.email` Does NOT Switch Accounts

You can run:

``` powershell
git config --global user.name "connectnexora"
git config --global user.email "you@email.com"
```

But this only changes the author information for future commits.

It does **not** change the GitHub account used for authentication.

GitHub push permission is checked using the saved authentication
credential/token.

You could set:

``` text
user.name = connectnexora
```

and still be authenticated as:

``` text
vyankateshsarje
```

That is exactly the type of problem that happened here.

------------------------------------------------------------------------

# 5. How Git Credential Manager (GCM) on Windows Works

The process is:

``` text
git push
    ↓
Git needs authentication for github.com
    ↓
Git asks Git Credential Manager
    ↓
GCM checks Windows Credential Store
    ↓
Saved GitHub credential is found
    ↓
Credential is sent to GitHub
    ↓
GitHub checks account permissions
```

If the saved credential belongs to the wrong account, Git can silently
reuse it.

So Git may not show a login window at all.

------------------------------------------------------------------------

# 6--8. Logout / Remove the Old GitHub Credentials

Run these **one at a time** in PowerShell or CMD.

## Step 1 --- Check the credential helper

``` powershell
git config --global credential.helper
```

Expected:

``` text
manager
```

This means Git Credential Manager is being used.

------------------------------------------------------------------------

## Step 2 --- Delete the saved GitHub login

``` powershell
cmdkey /delete:git:https://github.com
```

Expected:

``` text
CMDKEY: Credential deleted successfully.
```

This removes the saved GitHub credential from Windows Credential
Manager.

This is effectively the **logout** step for the stored GitHub
credential.

------------------------------------------------------------------------

## Alternative method

You can also run:

``` powershell
echo url=https://github.com | git credential reject
```

This tells Git to erase the stored credential for GitHub.

------------------------------------------------------------------------

## Step 3 --- GUI method (optional)

You can also remove the credential manually:

``` text
Control Panel
    ↓
User Accounts
    ↓
Credential Manager
    ↓
Windows Credentials
    ↓
Generic Credentials
    ↓
git:https://github.com
    ↓
Remove
```

This performs the same basic removal through the Windows interface.

------------------------------------------------------------------------

# 9. How to Verify Which Account Is Authenticated

Git Credential Manager does not always provide a simple `whoami`
command.

### A. Check the push error

Run:

``` powershell
git push -u origin main
```

If the account is wrong, GitHub may report:

``` text
Permission ... denied to USERNAME
```

The username shown there is the authenticated account.

------------------------------------------------------------------------

### B. List stored GitHub accounts

With newer Git Credential Manager versions:

``` powershell
git credential-manager github list
```

This may show logged-in GitHub accounts.

------------------------------------------------------------------------

### C. Check Windows Credential Store

``` powershell
cmdkey /list:git:https://github.com
```

If nothing is found, the saved credential has been removed.

> **Do not run `git credential fill` unless you know what you are doing.
> It can expose credential information on screen.**

------------------------------------------------------------------------

# 10. Set the Correct Remote

First check:

``` powershell
git remote -v
```

If the remote is wrong, fix it:

``` powershell
git remote set-url origin https://github.com/connectnexora/delete1.git
```

Then verify:

``` powershell
git remote -v
```

### Important

Changing the remote changes **where Git pushes**.

It does **not** change which GitHub account you are logged in as.

------------------------------------------------------------------------

# 11. Complete Normal Workflow

For a new or existing project, the general workflow is:

``` powershell
cd C:\Users\admin\Documents\CODING\Delete

git status

git remote -v

git config --global user.name "connectnexora"

git config --global user.email "YOUR_EMAIL"

cmdkey /delete:git:https://github.com

git add .

git commit -m "first commit"

git push -u origin main
```

When you run the push after removing the old credential:

``` text
git push
    ↓
Login popup appears
    ↓
Login with the correct GitHub account
    ↓
GitHub authenticates the account
    ↓
Push succeeds
    ↓
Credential is saved
    ↓
Future pushes normally don't require another login
```

### Your specific case

Your `add`, `commit`, branch, and remote setup were already completed.

So you did **not** need to redo the setup.

The main problem was the GitHub authentication account.

------------------------------------------------------------------------

# 12. What Happens When You Run `git push`

When you run:

``` powershell
git push
```

Git approximately does this:

### 1. Finds the commits

Git identifies the commits that need to be sent.

### 2. Reads the remote

It reads:

``` text
origin
```

which points to:

``` text
https://github.com/connectnexora/delete1.git
```

### 3. Requests authentication

Git asks Git Credential Manager for GitHub credentials.

### 4. Sends the request

Git sends the commits and authentication information to GitHub over
HTTPS.

### 5. GitHub checks permissions

GitHub asks:

> Does this authenticated account have permission to write to
> `connectnexora/delete1`?

### 6. Result

If yes:

``` text
Push successful
```

If no:

``` text
403 Permission denied
```

------------------------------------------------------------------------

# 13. How Git Knows Which Account Should Receive the Push

Git itself doesn't decide which account should receive the code.

It has two separate pieces of information:

### Where?

From the remote URL:

``` text
https://github.com/OWNER/REPOSITORY.git
```

For example:

``` text
https://github.com/connectnexora/delete1.git
```

### Who?

From the saved authentication credential:

``` text
Git Credential Manager
        ↓
Windows Credential Manager
        ↓
GitHub authentication
```

GitHub then compares the authenticated account with the repository
permissions.

For example:

``` text
Repository:
connectnexora/delete1

Authenticated account:
vyankateshsarje

Result:
Permission denied
```

After logging in correctly:

``` text
Repository:
connectnexora/delete1

Authenticated account:
connectnexora

Result:
Push allowed
```

------------------------------------------------------------------------

# 14--15. Windows Credential Manager + Checking GCM

The saved credential can be found through:

``` text
Control Panel
    ↓
User Accounts
    ↓
Credential Manager
    ↓
Windows Credentials
    ↓
Generic Credentials
    ↓
git:https://github.com
```

### Check the Git credential helper

``` powershell
git config --global credential.helper
```

### Check Git Credential Manager version

``` powershell
git credential-manager --version
```

Expected output will look similar to:

``` text
manager
```

and a version such as:

``` text
2.x.x
```

------------------------------------------------------------------------

# 16. FIX WRONG GITHUB ACCOUNT --- SAVE THIS

## Symptom

You see something like:

``` text
fatal: unable to access ...
403
Permission denied to WRONG_USER
```

### Fix

``` text
1. Run git push -u origin main
        ↓
2. Read the USERNAME in the error
        ↓
3. Run git remote -v
        ↓
4. Check the repository OWNER
        ↓
5. If USERNAME is the wrong account:
        ↓
6. Delete the saved credential
        ↓
7. Run git push again
        ↓
8. Login with the correct GitHub account
        ↓
9. Push succeeds
```

### Main command

``` powershell
cmdkey /delete:git:https://github.com
```

Then:

``` powershell
git push -u origin main
```

Login with the correct account when the authentication window appears.

------------------------------------------------------------------------

# Important Rule

**NEVER try to fix a GitHub authentication/account problem only by
changing:**

``` powershell
git config user.name
git config user.email
```

Those commands change the **commit author information**.

They do not necessarily change the **GitHub account used for
authentication**.

------------------------------------------------------------------------

# 17. Quick Mental Model

Remember this:

``` text
┌─────────────────────────────┐
│ Git commit identity         │
│ user.name / user.email      │
│                             │
│ "Who wrote this commit?"    │
└──────────────┬──────────────┘
               │
               │ different from
               ▼
┌─────────────────────────────┐
│ GitHub authentication       │
│ Credential Manager / Token   │
│                             │
│ "Which GitHub account am I?"│
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ GitHub repository           │
│ connectnexora/delete1       │
│                             │
│ "Does this account have     │
│  permission to push?"       │
└─────────────────────────────┘
```

------------------------------------------------------------------------

# 18. Cheat Sheet --- Commands Only

``` powershell
git status

git remote -v

git config --global user.name "YOUR_NAME"

git config --global user.email "YOUR_EMAIL"

git config --global credential.helper

cmdkey /delete:git:https://github.com

git remote set-url origin https://github.com/OWNER/REPO.git

git add .

git commit -m "message"

git push -u origin main
```

------------------------------------------------------------------------

# One-Line Summary

The problem was **not your Git repository or commit**. The repository
was correct, but Git Credential Manager had a saved GitHub credential
for `vyankateshsarje`, while you were trying to push to a repository
owned by `connectnexora`.

Deleting the old saved GitHub credential forced Git to ask for
authentication again, allowing you to log in with the correct account.
