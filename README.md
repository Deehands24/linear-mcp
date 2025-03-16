# Linear MCP (Model Control Protocol)

A TypeScript library for seamlessly integrating Linear's project management capabilities into any application.

## Installation

```bash
npm install @midwestdev/linear-mcp
# or
yarn add @midwestdev/linear-mcp
```

## Usage

```typescript
import { LinearMCP } from '@midwestdev/linear-mcp';

// Initialize the MCP with your Linear API key
const linearMCP = new LinearMCP({
  apiKey: 'your_linear_api_key'
});

// Create a team
const team = await linearMCP.createTeam({
  name: 'Development Team',
  key: 'DEV'
});

// Create a project
const project = await linearMCP.createProject({
  name: 'Website Redesign',
  teamId: team.id,
  description: 'Complete overhaul of the company website'
});

// Create an issue
const issue = await linearMCP.createIssue({
  title: 'Implement homepage design',
  description: 'Create the new homepage based on the approved designs',
  teamId: team.id,
  projectId: project.id,
  priority: 1
});

// Get all teams
const teams = await linearMCP.getTeams();

// Get projects for a team
const projects = await linearMCP.getProjects(team.id);

// Get issues for a team/project
const issues = await linearMCP.getIssues(team.id, project.id);

// Update an issue
await linearMCP.updateIssue(issue.id, {
  title: 'Updated title',
  description: 'Updated description'
});

// Delete an issue
await linearMCP.deleteIssue(issue.id);
```

## API Reference

### Configuration

The `LinearMCP` class accepts a configuration object with the following properties:

- `apiKey` (required): Your Linear API key

### Methods

#### Teams
- `createTeam(params: CreateTeamParams)`: Create a new team
- `getTeams()`: Get all teams

#### Projects
- `createProject(params: CreateProjectParams)`: Create a new project
- `getProjects(teamId: string)`: Get all projects for a team

#### Issues
- `createIssue(params: CreateIssueParams)`: Create a new issue
- `getIssues(teamId: string, projectId?: string)`: Get issues for a team/project
- `updateIssue(issueId: string, updates: Partial<CreateIssueParams>)`: Update an issue
- `deleteIssue(issueId: string)`: Delete an issue

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.