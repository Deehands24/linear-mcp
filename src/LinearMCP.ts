import { LinearClient } from '@linear/sdk';

export interface LinearMCPConfig {
  apiKey: string;
}

export interface CreateTeamParams {
  name: string;
  key: string;
  description?: string;
}

export interface CreateProjectParams {
  name: string;
  teamId: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface CreateIssueParams {
  title: string;
  description?: string;
  teamId: string;
  projectId?: string;
  priority?: number;
  assigneeId?: string;
  dueDate?: string;
  labels?: string[];
}

export class LinearMCP {
  private client: LinearClient;

  constructor(config: LinearMCPConfig) {
    this.client = new LinearClient({ apiKey: config.apiKey });
  }

  async createTeam(params: CreateTeamParams) {
    try {
      const team = await this.client.createTeam(params);
      return team;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  async createProject(params: CreateProjectParams) {
    try {
      const project = await this.client.createProject(params);
      return project;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async createIssue(params: CreateIssueParams) {
    try {
      const issue = await this.client.createIssue(params);
      return issue;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  }

  async getTeams() {
    try {
      const teams = await this.client.teams();
      return teams;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }

  async getProjects(teamId: string) {
    try {
      const projects = await this.client.projects({ filter: { team: { id: { eq: teamId } } } });
      return projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  async getIssues(teamId: string, projectId?: string) {
    try {
      const filter: any = { team: { id: { eq: teamId } } };
      if (projectId) {
        filter.project = { id: { eq: projectId } };
      }
      const issues = await this.client.issues({ filter });
      return issues;
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw error;
    }
  }

  async updateIssue(issueId: string, updates: Partial<CreateIssueParams>) {
    try {
      const issue = await this.client.issue(issueId);
      const updatedIssue = await issue.update(updates);
      return updatedIssue;
    } catch (error) {
      console.error('Error updating issue:', error);
      throw error;
    }
  }

  async deleteIssue(issueId: string) {
    try {
      const issue = await this.client.issue(issueId);
      await issue.delete();
      return true;
    } catch (error) {
      console.error('Error deleting issue:', error);
      throw error;
    }
  }
}