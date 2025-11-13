# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**hall-mgr-api** is a Hall Manager API designed to read Google Docs files from GitHub releases.

## Project Status

This is a new repository in initial setup phase. The codebase structure is being developed.

## Development Commands

Once the project is set up, common commands will be documented here:

- **Install dependencies**: `npm install` or `yarn install`
- **Run development server**: TBD
- **Run tests**: TBD
- **Build**: TBD
- **Lint**: TBD

## Architecture

### Core Functionality

The primary goal of this API is to:
1. Fetch GitHub release information
2. Read Google Docs files associated with releases
3. Provide API endpoints to access this data

### Technology Stack

To be determined based on implementation choices. Likely candidates:
- Node.js/TypeScript for the API server
- Google Docs API for reading document content
- GitHub API for accessing release information

## Git Workflow

- **Main branch**: `main` - production-ready code
- **Feature branches**: Use `claude/*` prefix for Claude Code sessions
- Always create descriptive commit messages
- Push changes to feature branches, not directly to main

## Environment Variables

Environment variables will be documented here as they are added. Expected variables:
- Google Docs API credentials
- GitHub API token
- Server configuration (port, etc.)
