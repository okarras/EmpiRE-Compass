# Contributing to EmpiRE-Compass

We love your input! We want to make contributing to EmpiRE-Compass as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Issues

Issues are a great way to keep track of tasks, enhancements, and bugs for our project. We use GitHub issues to track all changes and discussions.

#### Creating Issues

1. **Use Issue Templates**: When available, use the appropriate issue template
2. **Clear Title**: Write a clear, descriptive title that summarizes the issue
3. **Detailed Description**: Include:
   - Expected behavior
   - Current behavior
   - Steps to reproduce (for bugs)
   - Screenshots (if applicable)
   - Environment details (OS, browser, etc.)
4. **Labels**: Use appropriate labels to categorize your issue

### Branch Naming Convention

All branch names should follow this format:
```
<type>/<short-description>
```

Where `type` can be:
- `feature` - New feature or enhancement
- `bugfix` - Bug fix
- `hotfix` - Critical fix for production
- `docs` - Documentation updates
- `refactor` - Code refactoring
- `test` - Adding or modifying tests

Example: `feature/user-authentication`

### Git Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

Example commit messages:
```
feat(auth): add user authentication system
fix(api): resolve data fetching timeout issue
docs: update API documentation
```

### Pull Request Process

1. **Branch Creation**
   - Create a new branch from `main` using the naming convention above
   - Keep your branch focused on a single feature or fix

2. **Development**
   - Write clean, documented, and tested code
   - Follow the project's code style and conventions
   - Keep commits atomic and follow commit message guidelines

3. **Before Submitting**
   - Update the README.md with details of changes if needed
   - Ensure all tests pass
   - Update documentation as needed
   - Verify your changes locally

4. **Submitting**
   - Create a Pull Request with a clear title and description
   - Link any related issues
   - Request review from maintainers
   - Address review comments promptly

5. **Merging**
   - PRs require at least one approval from maintainers
   - All CI checks must pass
   - Commits should be squashed if necessary

### Code Style

- Follow consistent code formatting
- Write clear, self-documenting code
- Include comments for complex logic
- Follow language-specific best practices

### Testing

- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Include both positive and negative test cases
- Maintain test coverage standards

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team. All complaints will be reviewed and investigated promptly and fairly.

## License

By contributing, you agree that your contributions will be licensed under the project's license.

## Questions?

Don't hesitate to ask questions by creating an issue or contacting the maintainers directly. 