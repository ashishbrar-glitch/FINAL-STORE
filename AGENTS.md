# AI Studio Agent Instructions for BCN Store

**CRITICAL: EXISTING PRODUCTION CONNECTIONS AND DEPLOYMENT RULES**
This project is ALREADY connected and working as a production application.
DO NOT create, replace, reconnect, or redesign the existing deployment architecture.

## CURRENT PIPELINE:
Google AI Studio -> GitHub repository -> Railway -> Production application (bcnmart.in)

- GitHub is connected to Railway with automatic deployment enabled.
- EVERY COMMIT TO THE PRODUCTION BRANCH MAY TRIGGER A RAILWAY DEPLOYMENT.
- Treat every GitHub change as a potential PRODUCTION DEPLOYMENT.
- DO NOT make changes that can break this automation.

## RAILWAY (Production Hosting)
- The existing Railway service, project, and environment must be preserved.
- The existing GitHub repository connection must be preserved.
- Do not disconnect/reconnect GitHub or create a new Railway service/project.
- Do not change Railway networking configuration, production port, or domain configuration.
- Do not modify Railway settings just to solve a code problem.

## PACKAGE MANAGER (NPM ONLY)
- THIS PROJECT USES NPM ONLY.
- Use ONLY: `package.json` and `package-lock.json`.
- **NEVER CREATE OR RESTORE:** `bun.lock` or `bun.lockb`. (This caused previous Railway deployment problems).
- If you see `bun.lock` or `bun.lockb` anywhere: DO NOT add them back.

## ENVIRONMENT VARIABLES
- The production application already has environment variables configured in Railway.
- DO NOT delete, rename, or replace existing Railway environment variables.
- DO NOT move production secrets into GitHub, hardcode secrets, or create a new `.env` system.
- `.env.example` may contain variable NAMES and empty placeholders (e.g., `GEMINI_API_KEY=`). NEVER put real secret values into `.env.example` or commit a real `.env` file to GitHub.

## FIREBASE
- The application is already connected to the existing Firebase project.
- DO NOT create a new Firebase project, replace it, change configuration unnecessarily, delete Firestore data, or create a second Firebase backend.

## AI STUDIO WORKFLOW
- Modify the existing project and preserve existing files, integrations, env-var names, and Firebase configuration.
- Do not assume this is a new project. It is an EXISTING production project being continuously developed.
- Do not delete files unless confirmed obsolete.
- Do not rename important files or environment variables unnecessarily.

## BUILD SAFETY CHECKS
Before considering a change complete, ensure:
1. `npm install` can work.
2. `package-lock.json` remains valid.
3. No `bun.lock` or `bun.lockb` exists.
4. `npm run build` can work.
5. Firebase imports/configuration still work.
6. Existing environment-variable names are unchanged.
7. Existing routes/API calls and functionality are preserved.
8. The GitHub -> Railway deployment pipeline remains compatible.

**MOST IMPORTANT RULE:** DO NOT "FIX" A PROBLEM BY CHANGING THE DEPLOYMENT ARCHITECTURE. If something fails, FIRST investigate the existing configuration and code.

## GITHUB REPOSITORY PRESERVATION
**GITHUB REPOSITORY MUST NEVER BE REPLACED OR DUPLICATED.**

This project already has an existing GitHub repository, and that repository is connected to our Railway production deployment.

The existing repository is:
https://github.com/ashu78546/BCN-STORE

THIS IS THE ONLY AUTHORIZED REPOSITORY FOR THIS PROJECT.

NEVER:
- Create a new GitHub repository for this project.
- Automatically create a new repository.
- Fork the project into another repository.
- Change the connected repository.
- Disconnect the existing GitHub repository.
- Reconnect the project to a newly created repository.
- Create another repository because of an import, backup, conflict, sync, or AI Studio session.
- Push the project to a different repository.
- Change the GitHub organization/user/repository without explicit permission.

IMPORTANT HISTORY:
Previously, an incorrect workflow caused the connection to the existing GitHub repository to be lost, and a new repository was created instead.

THIS MUST NOT HAPPEN AGAIN.

The existing GitHub repository is part of our production infrastructure:

AI STUDIO
    ↓
EXISTING GITHUB REPOSITORY
    ↓
RAILWAY AUTO-DEPLOY
    ↓
bcnmart.in

Therefore, preserving the existing GitHub repository connection is a HARD PRODUCTION REQUIREMENT.

WHEN IMPORTING OR RESTORING:
If AI Studio asks whether to:
- create a new repository
- create a new GitHub repository
- choose a repository
- connect GitHub
- reconnect GitHub
- create a backup repository
- duplicate the project

DO NOT automatically choose the new repository option.

Always use the EXISTING repository:
ashu78546/BCN-STORE

If the existing repository cannot be accessed or AI Studio is about to create a new repository, STOP and ask me before doing anything.

NEVER solve a GitHub connection problem by creating a new repository.

BEFORE ANY GITHUB ACTION:
Verify that the destination is the existing repository:
ashu78546/BCN-STORE

If there is any uncertainty about the repository, STOP and ask for confirmation.

A new GitHub repository may break the existing Railway auto-deployment pipeline, so repository identity must be treated as production infrastructure.

DO NOT CHANGE THIS CONNECTION UNLESS I EXPLICITLY ASK YOU TO.
