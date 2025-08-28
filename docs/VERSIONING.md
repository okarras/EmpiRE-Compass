# Versioning and Release Process

This document outlines the versioning and release process for the EmpiRE-Compass project. We follow a standardized approach to ensure that our version numbers are meaningful and our release process is automated and consistent.

## Semantic Versioning (SemVer)

This project adheres to [Semantic Versioning 2.0.0](https://semver.org/). Our version numbers follow the `MAJOR.MINOR.PATCH` format:

- **MAJOR** version for incompatible API changes.
- **MINOR** version for adding functionality in a backward-compatible manner.
- **PATCH** version for backward-compatible bug fixes.

## Conventional Commits

To automate the versioning process, all commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This provides a clear and descriptive commit history and allows our tooling to automatically determine the next version number.

### Commit Message Structure

A commit message should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

The following are the most common types to use:

- **`feat`**: A new feature for the user (this correlates with a `MINOR` version bump).
- **`fix`**: A bug fix for the user (this correlates with a `PATCH` version bump).
- **`docs`**: Changes to the documentation only.
- **`style`**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
- **`refactor`**: A code change that neither fixes a bug nor adds a feature.
- **`perf`**: A code change that improves performance.
- **`test`**: Adding missing tests or correcting existing tests.
- **`build`**: Changes that affect the build system or external dependencies.
- **`ci`**: Changes to our CI configuration files and scripts.
- **`chore`**: Other changes that don't modify `src` or `test` files.
- **`revert`**: Reverts a previous commit.

**Important**: A commit with a `feat` or `fix` type will trigger a new release. If a commit includes a `BREAKING CHANGE` in the footer, it will trigger a `MAJOR` version bump.

### Examples

```sh
# A commit for a new feature
feat: allow users to export chat history

# A commit for a bug fix
fix: correct chart rendering in AI messages

# A commit with a breaking change
feat: change user authentication method
BREAKING CHANGE: The user authentication endpoint has been changed from /login to /auth/login.
```

## Release Process

The release process is automated using `standard-version`. When you are ready to release a new version, follow these steps:

1.  Ensure your local `main` branch is up to date with the remote repository.
2.  Run the release command:
    ```bash
    npm run release
    ```
3.  This command will automatically:
    - Determine the new version number based on your `feat` and `fix` commits.
    - Update the version in `package.json`.
    - Generate a `CHANGELOG.md` file with all the changes.
    - Create a new Git commit and tag for the release.
4.  Push the changes and the new tag to the remote repository:
    ```bash
    git push --follow-tags origin main
    ```

That's it! The new version will be published.
