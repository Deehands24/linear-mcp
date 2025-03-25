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

export interface ProjectPlanGenerationParams {
  projectName: string;
  projectScope: string;
  industry?: string;
  timeline?: string;
  technicalRequirements?: string[];
  targetAudience?: string;
}

export interface ProjectPlan {
  projectDescription: string;
  milestones: Array<{
    title: string;
    description: string;
    issues: Array<{
      title: string;
      description: string;
      priority: number;
      estimatedHours?: number;
      labels?: string[];
    }>;
  }>;
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
      const project = await this.client.createProject({
        name: params.name,
        teamIds: [params.teamId],
        description: params.description,
        icon: params.icon,
        color: params.color
      });
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
      // Get the team first
      const team = await this.client.team(teamId);
      // Then get projects for that team
      const projects = await team.projects();
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

  /**
   * Generates a detailed project plan with milestones and issues based on provided parameters.
   * This leverages AI knowledge to create comprehensive project structures.
   */
  async generateProjectPlan(params: ProjectPlanGenerationParams): Promise<ProjectPlan> {
    try {
      // This function would ideally call an AI service, but for now we'll use predefined templates
      // based on the project scope and industry
      
      // Example implementation with predefined templates
      const plan = this.createDetailedProjectPlan(params);
      return plan;
    } catch (error) {
      console.error('Error generating project plan:', error);
      throw error;
    }
  }

  /**
   * Creates a project with a full set of milestones and issues based on the generated plan.
   * This creates a comprehensive project structure in Linear.
   */
  async createProjectWithPlan(teamId: string, planParams: ProjectPlanGenerationParams) {
    try {
      // Generate the detailed plan
      const plan = await this.generateProjectPlan(planParams);
      
      // Create the project
      const projectResponse = await this.createProject({
        name: planParams.projectName,
        teamId: teamId,
        description: plan.projectDescription
      });
      
      // Get the project ID from the response
      // We need to handle the structure properly
      let projectId: string | undefined;
      if (projectResponse && typeof projectResponse === 'object' && 'id' in projectResponse) {
        projectId = projectResponse.id as string;
      }
      
      if (!projectId) {
        throw new Error('Failed to get project ID from creation response');
      }
      
      // Create all milestones and their issues
      const createdMilestones = [];
      for (const milestone of plan.milestones) {
        // Create milestone (Linear doesn't have direct milestone concept, so we could use labels or parent issues)
        // For this example, we'll create a parent issue for each milestone
        const milestoneIssue = await this.createIssue({
          title: `Milestone: ${milestone.title}`,
          description: milestone.description,
          teamId: teamId,
          projectId: projectId,
          priority: 1, // High priority for milestones
          labels: ['milestone']
        });
        
        // Create all issues for this milestone
        const createdIssues = [];
        for (const issue of milestone.issues) {
          const createdIssue = await this.createIssue({
            title: issue.title,
            description: this.generateDetailedIssueDescription(issue.description, planParams),
            teamId: teamId,
            projectId: projectId,
            priority: issue.priority,
            labels: issue.labels
          });
          
          createdIssues.push(createdIssue);
        }
        
        createdMilestones.push({
          milestone: milestoneIssue,
          issues: createdIssues
        });
      }
      
      return {
        project: projectResponse,
        milestones: createdMilestones
      };
    } catch (error) {
      console.error('Error creating project with plan:', error);
      throw error;
    }
  }

  /**
   * Creates a detailed project plan based on the provided parameters.
   * This is where industry-specific knowledge would be applied.
   */
  private createDetailedProjectPlan(params: ProjectPlanGenerationParams): ProjectPlan {
    const { projectName, projectScope, industry, timeline } = params;
    
    // This would be where you integrate with an AI service or use predefined templates
    // For now, let's create a basic template based on the industry and scope
    
    let plan: ProjectPlan = {
      projectDescription: `Comprehensive project plan for ${projectName}. Scope includes ${projectScope}.`,
      milestones: []
    };
    
    // Different plan structures based on industry
    if (industry?.toLowerCase().includes('software') || !industry) {
      plan = this.createSoftwareDevelopmentPlan(params);
    } else if (industry?.toLowerCase().includes('marketing')) {
      plan = this.createMarketingPlan(params);
    } else if (industry?.toLowerCase().includes('design')) {
      plan = this.createDesignPlan(params);
    } else {
      plan = this.createGenericPlan(params);
    }
    
    return plan;
  }

  /**
   * Creates a detailed software development project plan.
   */
  private createSoftwareDevelopmentPlan(params: ProjectPlanGenerationParams): ProjectPlan {
    const { projectName, projectScope, technicalRequirements = [] } = params;
    
    return {
      projectDescription: `${projectName}: A software development project focusing on ${projectScope}. This project will implement a comprehensive solution that addresses key challenges in this domain while ensuring scalability, security, and excellent user experience.`,
      milestones: [
        {
          title: "Discovery & Analysis",
          description: "Understand requirements, analyze the problem domain, and establish project foundations.",
          issues: [
            {
              title: "Stakeholder interviews and requirement gathering",
              description: "Conduct structured interviews with all stakeholders to collect detailed requirements, expectations, constraints, and success criteria. Document findings in a comprehensive requirements document.",
              priority: 1,
              estimatedHours: 10,
              labels: ["discovery", "requirements"]
            },
            {
              title: "Market and competitor analysis",
              description: "Research competing solutions, identify their strengths and weaknesses, analyze market trends, and document opportunities for differentiation and innovation.",
              priority: 2,
              estimatedHours: 8,
              labels: ["research", "discovery"]
            },
            {
              title: "User personas and journey mapping",
              description: "Create detailed user personas representing target users. Map comprehensive user journeys showing how different personas will interact with the system to accomplish their goals.",
              priority: 1,
              estimatedHours: 12,
              labels: ["ux", "discovery"]
            },
            {
              title: "Technical feasibility assessment",
              description: "Evaluate technical approaches against requirements, assess risks, explore alternative solutions, and document technology selection decisions with justifications.",
              priority: 1,
              estimatedHours: 14,
              labels: ["architecture", "planning"]
            },
            {
              title: "Project charter and scope document",
              description: "Create a comprehensive project charter defining scope, objectives, deliverables, timeline, budget, team structure, and governance framework.",
              priority: 1,
              estimatedHours: 6,
              labels: ["documentation", "planning"]
            }
          ]
        },
        {
          title: "Requirements & Planning",
          description: "Define detailed requirements, create technical specifications, and establish project timeline.",
          issues: [
            {
              title: "Create detailed user stories and acceptance criteria",
              description: "Document comprehensive user stories with acceptance criteria for all main features. Include edge cases, validation rules, and performance expectations for each story.",
              priority: 1,
              estimatedHours: 16,
              labels: ["documentation", "planning"]
            },
            {
              title: "Define technical architecture and system design",
              description: `Design the system architecture considering ${technicalRequirements.join(', ') || 'all technical requirements'}. Include detailed diagrams for system components, data flows, API specifications, security model, and data models. Document scalability, reliability, and performance considerations.`,
              priority: 1,
              estimatedHours: 24,
              labels: ["architecture", "planning"]
            },
            {
              title: "Create database schema and data migration plan",
              description: "Design comprehensive database schema with tables, relationships, indexing strategy, and validation rules. Develop data migration strategy if updating an existing system.",
              priority: 1,
              estimatedHours: 12,
              labels: ["database", "architecture"]
            },
            {
              title: "Set up development infrastructure and environments",
              description: "Configure development, staging, testing, and production environments with CI/CD pipelines. Document setup procedures, access controls, and environment configuration details.",
              priority: 2,
              estimatedHours: 10,
              labels: ["devops", "infrastructure"]
            },
            {
              title: "Create detailed project roadmap and sprint planning",
              description: "Develop a comprehensive project timeline with milestones, deliverables, dependencies, critical path analysis, and resource allocation. Organize user stories into initial sprints.",
              priority: 1,
              estimatedHours: 8,
              labels: ["planning", "management"]
            },
            {
              title: "Establish coding standards and development workflows",
              description: "Document coding standards, pull request processes, review requirements, testing protocols, and deployment procedures. Set up linting and formatting tools to enforce standards.",
              priority: 2,
              estimatedHours: 6,
              labels: ["documentation", "process"]
            }
          ]
        },
        {
          title: "Design & Prototyping",
          description: "Create UI/UX designs and interactive prototypes for key user flows.",
          issues: [
            {
              title: "Develop brand and design system",
              description: "Create a comprehensive design system including typography, color palette, spacing guidelines, component library, and interaction patterns. Ensure consistency with brand identity and accessibility standards.",
              priority: 1,
              estimatedHours: 20,
              labels: ["design", "branding"]
            },
            {
              title: "Create wireframes for all main screens",
              description: "Design low-fidelity wireframes for all core user flows and get stakeholder approval. Include mobile, tablet, and desktop variations where appropriate. Document layout principles and information hierarchy.",
              priority: 2,
              estimatedHours: 16,
              labels: ["design", "ux"]
            },
            {
              title: "Develop high-fidelity mockups",
              description: "Create detailed visual designs based on approved wireframes, including responsive variations. Apply the design system consistently across all screens. Document design decisions and rationale.",
              priority: 2,
              estimatedHours: 24,
              labels: ["design", "ui"]
            },
            {
              title: "Build interactive prototype",
              description: "Create clickable prototype demonstrating key user flows for testing and stakeholder review. Include critical interactions, form validations, navigation patterns, and conditional behaviors.",
              priority: 2,
              estimatedHours: 16,
              labels: ["prototype", "ux"]
            },
            {
              title: "Conduct usability testing on prototypes",
              description: "Perform usability testing with representative users, record findings, identify issues, and incorporate feedback into design revisions. Document testing methodology and results.",
              priority: 1,
              estimatedHours: 12,
              labels: ["testing", "ux"]
            },
            {
              title: "Create UI component specifications for developers",
              description: "Document detailed specifications for UI components including states, behaviors, animations, accessibility requirements, and implementation guidelines for development team.",
              priority: 2,
              estimatedHours: 12,
              labels: ["documentation", "ui"]
            }
          ]
        },
        {
          title: "Core Development",
          description: "Implement the fundamental features and establish the technical foundation.",
          issues: [
            {
              title: "Set up project repository and codebase structure",
              description: "Initialize repository with proper structure, README, contribution guidelines, and initial configuration. Set up branching strategy, protection rules, and automation workflows.",
              priority: 1,
              estimatedHours: 4,
              labels: ["setup", "development"]
            },
            {
              title: "Implement core application architecture",
              description: "Build foundational architectural components following the design specifications. Establish patterns for state management, dependency injection, error handling, and logging.",
              priority: 1,
              estimatedHours: 20,
              labels: ["architecture", "development"]
            },
            {
              title: "Set up database schema and migrations",
              description: "Design and implement database structure with proper indexing, relationships, and optimization. Create migration framework and initial schema migrations. Implement data access layer with proper abstractions.",
              priority: 1,
              estimatedHours: 12,
              labels: ["backend", "database"]
            },
            {
              title: "Implement authentication and authorization system",
              description: "Create secure user authentication with role-based permissions, password policies, session management, and account recovery. Implement proper authorization checks throughout the application.",
              priority: 1,
              estimatedHours: 16,
              labels: ["security", "backend"]
            },
            {
              title: "Develop core API endpoints and service layer",
              description: "Implement RESTful or GraphQL API endpoints for core functionality with proper validation, error handling, and documentation. Create service layer with business logic separate from controllers.",
              priority: 1,
              estimatedHours: 24,
              labels: ["backend", "api"]
            },
            {
              title: "Implement base UI components and framework",
              description: "Build reusable UI component library according to design system specifications. Implement layout components, form controls, navigation elements, and utility components.",
              priority: 1,
              estimatedHours: 20,
              labels: ["frontend", "components"]
            },
            {
              title: "Set up automated testing framework",
              description: "Configure testing frameworks for unit, integration, and end-to-end tests. Create initial test cases and documentation for test patterns. Set up test automation in CI pipeline.",
              priority: 2,
              estimatedHours: 10,
              labels: ["testing", "quality"]
            },
            {
              title: "Implement logging, monitoring, and error tracking",
              description: "Set up comprehensive logging system, application monitoring, and error tracking integration. Configure alerts and establish observability practices.",
              priority: 2,
              estimatedHours: 8,
              labels: ["devops", "monitoring"]
            }
          ]
        },
        {
          title: "Feature Implementation",
          description: "Build out all planned features according to specifications.",
          issues: [
            {
              title: "Implement user management and profile features",
              description: "Build user registration, login, profile management, account settings, and related functionality. Include email verification, password reset, and profile customization features.",
              priority: 1,
              estimatedHours: 20,
              labels: ["frontend", "backend", "feature"]
            },
            {
              title: "Implement user dashboard",
              description: "Create the main user dashboard showing key metrics, recent activity, and quick actions. Implement data visualization components, activity feeds, and personalization options.",
              priority: 2,
              estimatedHours: 18,
              labels: ["frontend", "feature"]
            },
            {
              title: "Build search and filtering functionality",
              description: "Implement advanced search with filters, sorting options, and saved searches capability. Optimize for performance with proper indexing and caching strategies.",
              priority: 2,
              estimatedHours: 14,
              labels: ["frontend", "backend", "feature"]
            },
            {
              title: "Create reporting module",
              description: "Develop customizable reports with data visualization, export options, and scheduling features. Implement data aggregation, filtering, and visualization components.",
              priority: 3,
              estimatedHours: 22,
              labels: ["frontend", "data", "feature"]
            },
            {
              title: "Implement notification system",
              description: "Build a comprehensive notification system with in-app alerts, email notifications, and preference management. Include real-time updates and batch processing capabilities.",
              priority: 2,
              estimatedHours: 16,
              labels: ["frontend", "backend", "feature"]
            },
            {
              title: "Develop administrative functions",
              description: "Create administrative interface for user management, system configuration, content moderation, and other administrative tasks. Implement proper access controls and audit logging.",
              priority: 2,
              estimatedHours: 24,
              labels: ["frontend", "backend", "feature"]
            },
            {
              title: "Implement integration with third-party services",
              description: "Build integrations with required external services such as payment processors, email services, analytics platforms, and other third-party APIs. Ensure proper error handling and fallback mechanisms.",
              priority: 2,
              estimatedHours: 18,
              labels: ["integration", "feature"]
            },
            {
              title: "Create mobile responsive adaptations",
              description: "Optimize application for mobile devices with responsive layouts, touch interactions, and mobile-specific features. Test across various device sizes and orientations.",
              priority: 2,
              estimatedHours: 14,
              labels: ["frontend", "mobile", "feature"]
            }
          ]
        },
        {
          title: "Testing & Quality Assurance",
          description: "Ensure the application meets all requirements and functions correctly.",
          issues: [
            {
              title: "Write unit tests for core functionality",
              description: "Create comprehensive test suite covering all critical paths and edge cases. Establish testing patterns and utilities to facilitate thorough testing.",
              priority: 1,
              estimatedHours: 20,
              labels: ["testing", "quality"]
            },
            {
              title: "Perform integration testing",
              description: "Test interactions between different components and external services. Verify that all parts of the system work together correctly under various conditions.",
              priority: 2,
              estimatedHours: 16,
              labels: ["testing", "quality"]
            },
            {
              title: "Conduct end-to-end testing",
              description: "Create automated end-to-end tests for critical user journeys. Verify complete workflows function correctly across all system components.",
              priority: 2,
              estimatedHours: 14,
              labels: ["testing", "quality"]
            },
            {
              title: "Perform accessibility audit and remediation",
              description: "Audit application for accessibility compliance (WCAG 2.1 AA), identify issues, and implement necessary fixes. Include screen reader testing and keyboard navigation verification.",
              priority: 1,
              estimatedHours: 12,
              labels: ["accessibility", "quality"]
            },
            {
              title: "Conduct security audit",
              description: "Perform thorough security assessment including penetration testing, vulnerability scanning, and code review for security issues. Address identified vulnerabilities.",
              priority: 1,
              estimatedHours: 16,
              labels: ["security", "quality"]
            },
            {
              title: "Run performance testing and optimization",
              description: "Test application performance under various load conditions, identify bottlenecks, and implement optimizations. Measure and document performance metrics before and after improvements.",
              priority: 2,
              estimatedHours: 18,
              labels: ["performance", "quality"]
            },
            {
              title: "Conduct user acceptance testing",
              description: "Facilitate testing sessions with stakeholders and end users to validate the solution meets requirements and expectations. Document feedback and required changes.",
              priority: 1,
              estimatedHours: 12,
              labels: ["testing", "stakeholder"]
            },
            {
              title: "Create test documentation and reports",
              description: "Document test plans, test cases, testing coverage, and test results. Create comprehensive testing report for stakeholders and project documentation.",
              priority: 2,
              estimatedHours: 8,
              labels: ["documentation", "quality"]
            }
          ]
        },
        {
          title: "Deployment & Launch",
          description: "Prepare for and execute the product launch.",
          issues: [
            {
              title: "Create deployment documentation",
              description: "Document detailed deployment procedures, system requirements, configuration instructions, and maintenance processes. Include troubleshooting guides and rollback procedures.",
              priority: 1,
              estimatedHours: 8,
              labels: ["documentation", "devops"]
            },
            {
              title: "Set up production environment",
              description: "Configure and secure production infrastructure, databases, storage, and networking. Implement monitoring, backup systems, and disaster recovery provisions.",
              priority: 1,
              estimatedHours: 12,
              labels: ["infrastructure", "devops"]
            },
            {
              title: "Perform load testing",
              description: "Test system performance under expected and peak loads, identify bottlenecks, and implement necessary optimizations. Document capacity planning recommendations.",
              priority: 2,
              estimatedHours: 10,
              labels: ["testing", "performance"]
            },
            {
              title: "Conduct pre-launch security review",
              description: "Perform final security assessment including configuration review, credential management audit, and infrastructure security verification.",
              priority: 1,
              estimatedHours: 6,
              labels: ["security", "review"]
            },
            {
              title: "Create user documentation and help resources",
              description: "Develop comprehensive user guides, help documentation, FAQ, and tutorial content. Include screenshots, video demonstrations, and troubleshooting information.",
              priority: 2,
              estimatedHours: 14,
              labels: ["documentation", "support"]
            },
            {
              title: "Prepare support and maintenance plan",
              description: "Establish support processes, escalation procedures, and maintenance schedule. Create incident response plan and communication templates.",
              priority: 2,
              estimatedHours: 6,
              labels: ["planning", "support"]
            },
            {
              title: "Conduct staff training",
              description: "Train support staff, administrators, and other relevant team members on system operation, administration, and troubleshooting processes.",
              priority: 2,
              estimatedHours: 8,
              labels: ["training", "support"]
            },
            {
              title: "Execute production deployment",
              description: "Deploy to production environment following established procedures with rollback strategy. Perform post-deployment verification and monitoring.",
              priority: 1,
              estimatedHours: 8,
              labels: ["devops", "release"]
            },
            {
              title: "Post-launch monitoring and support",
              description: "Actively monitor system performance, error rates, and user activity during initial launch period. Address issues promptly and provide heightened support availability.",
              priority: 1,
              estimatedHours: 16,
              labels: ["support", "monitoring"]
            }
          ]
        },
        {
          title: "Post-Launch Optimization",
          description: "Gather feedback, make improvements, and plan future development.",
          issues: [
            {
              title: "Collect and analyze user feedback",
              description: "Gather user feedback through surveys, interviews, support requests, and analytics. Analyze patterns and prioritize improvement opportunities.",
              priority: 2,
              estimatedHours: 10,
              labels: ["feedback", "analysis"]
            },
            {
              title: "Conduct post-launch retrospective",
              description: "Facilitate team retrospective to review project execution, identify lessons learned, and document recommendations for future projects.",
              priority: 2,
              estimatedHours: 4,
              labels: ["process", "review"]
            },
            {
              title: "Implement critical fixes and improvements",
              description: "Address high-priority issues identified post-launch. Implement quick wins and critical improvements based on user feedback and performance data.",
              priority: 1,
              estimatedHours: 20,
              labels: ["development", "optimization"]
            },
            {
              title: "Optimize performance and resource usage",
              description: "Analyze performance metrics, identify optimization opportunities, and implement improvements to enhance speed, reliability, and resource efficiency.",
              priority: 2,
              estimatedHours: 16,
              labels: ["performance", "optimization"]
            },
            {
              title: "Create roadmap for future enhancements",
              description: "Develop prioritized roadmap for future development phases based on user feedback, business objectives, and technical considerations.",
              priority: 2,
              estimatedHours: 8,
              labels: ["planning", "strategy"]
            },
            {
              title: "Document project completion and transfer ownership",
              description: "Create final project documentation, transfer knowledge to operational teams, and formally close the project phase.",
              priority: 1,
              estimatedHours: 6,
              labels: ["documentation", "closure"]
            }
          ]
        }
      ]
    };
  }

  /**
   * Creates a detailed marketing project plan.
   */
  private createMarketingPlan(params: ProjectPlanGenerationParams): ProjectPlan {
    const { projectName, projectScope, targetAudience } = params;
    
    return {
      projectDescription: `${projectName}: A comprehensive marketing initiative focused on ${projectScope}. This campaign will increase brand awareness, engage ${targetAudience || 'target audiences'}, and drive measurable business outcomes.`,
      milestones: [
        {
          title: "Research & Strategy",
          description: "Analyze market trends, competitor activities, and audience preferences to form campaign strategy.",
          issues: [
            {
              title: "Conduct market research",
              description: "Analyze current market trends, identify opportunities and threats, and compile findings report.",
              priority: 1,
              labels: ["research", "strategy"]
            },
            {
              title: "Develop detailed audience personas",
              description: `Create comprehensive profiles of ${targetAudience || 'target audience segments'} including demographics, behaviors, needs, and pain points.`,
              priority: 2,
              labels: ["research", "audience"]
            },
            {
              title: "Formulate marketing strategy",
              description: "Develop overarching strategy including positioning, messaging, channels, and KPIs.",
              priority: 1,
              labels: ["strategy"]
            }
          ]
        },
        {
          title: "Content Creation",
          description: "Produce all campaign content assets across required formats and channels.",
          issues: [
            {
              title: "Create messaging guidelines",
              description: "Develop tone of voice, key messages, and communication framework for campaign consistency.",
              priority: 1,
              labels: ["content", "branding"]
            },
            {
              title: "Produce visual content",
              description: "Design campaign visuals including graphics, photography, videos, and animations.",
              priority: 2,
              labels: ["content", "design"]
            },
            {
              title: "Write copy for all channels",
              description: "Create compelling copy for website, social media, email, advertisements, and other touchpoints.",
              priority: 2,
              labels: ["content", "copy"]
            }
          ]
        },
        {
          title: "Campaign Setup",
          description: "Configure digital platforms, establish tracking, and prepare for launch.",
          issues: [
            {
              title: "Set up campaign tracking",
              description: "Implement analytics, attribution models, and reporting dashboards for performance monitoring.",
              priority: 1,
              labels: ["analytics", "setup"]
            },
            {
              title: "Configure digital advertising",
              description: "Set up ad accounts, create audience segments, and prepare ad creatives across platforms.",
              priority: 2,
              labels: ["advertising", "setup"]
            },
            {
              title: "Prepare email marketing sequence",
              description: "Build email templates, automation flows, and segmentation rules in email platform.",
              priority: 2,
              labels: ["email", "setup"]
            }
          ]
        },
        {
          title: "Campaign Execution",
          description: "Launch and actively manage all campaign elements.",
          issues: [
            {
              title: "Execute multichannel launch",
              description: "Coordinate simultaneous activation across all channels according to campaign timeline.",
              priority: 1,
              labels: ["execution", "launch"]
            },
            {
              title: "Manage social media campaign",
              description: "Publish, monitor, and engage with content across social platforms throughout campaign duration.",
              priority: 2,
              labels: ["social", "execution"]
            },
            {
              title: "Optimize advertising performance",
              description: "Monitor ad performance daily, adjust targeting, bidding, and creative elements for maximum ROI.",
              priority: 2,
              labels: ["advertising", "optimization"]
            }
          ]
        },
        {
          title: "Analysis & Reporting",
          description: "Measure results, extract insights, and document campaign performance.",
          issues: [
            {
              title: "Track KPI achievement",
              description: "Monitor performance against established KPIs, identify variances and success factors.",
              priority: 1,
              labels: ["analytics", "reporting"]
            },
            {
              title: "Conduct A/B test analysis",
              description: "Analyze results of all campaign experiments, document learnings and recommendations.",
              priority: 3,
              labels: ["testing", "analytics"]
            },
            {
              title: "Create comprehensive campaign report",
              description: "Compile detailed performance report with results, insights, and recommendations for future campaigns.",
              priority: 2,
              labels: ["reporting", "documentation"]
            }
          ]
        }
      ]
    };
  }

  /**
   * Creates a detailed design project plan.
   */
  private createDesignPlan(params: ProjectPlanGenerationParams): ProjectPlan {
    const { projectName, projectScope } = params;
    
    return {
      projectDescription: `${projectName}: A design project focusing on ${projectScope}. This project will deliver innovative, user-centered design solutions that balance aesthetic excellence with functional requirements.`,
      milestones: [
        {
          title: "Research & Discovery",
          description: "Gather insights, understand requirements, and define design objectives.",
          issues: [
            {
              title: "Conduct stakeholder interviews",
              description: "Interview key stakeholders to understand business goals, constraints, and expectations.",
              priority: 1,
              labels: ["research", "discovery"]
            },
            {
              title: "Perform competitive analysis",
              description: "Analyze competitor designs, identify trends, strengths, weaknesses, and opportunities.",
              priority: 2,
              labels: ["research", "analysis"]
            },
            {
              title: "Create design brief",
              description: "Document project scope, objectives, target audience, design requirements, and constraints.",
              priority: 1,
              labels: ["documentation", "planning"]
            }
          ]
        },
        {
          title: "Concept Development",
          description: "Generate and explore design concepts and directions.",
          issues: [
            {
              title: "Develop mood boards",
              description: "Create visual collections representing potential design directions, styles, and aesthetics.",
              priority: 3,
              labels: ["concept", "visual"]
            },
            {
              title: "Sketch initial concepts",
              description: "Produce range of rough conceptual sketches exploring different approaches and solutions.",
              priority: 1,
              labels: ["concept", "ideation"]
            },
            {
              title: "Present concept directions",
              description: "Prepare and deliver presentation of design concepts for stakeholder feedback and direction selection.",
              priority: 2,
              labels: ["presentation", "concept"]
            }
          ]
        },
        {
          title: "Design Development",
          description: "Refine selected concept into comprehensive design solution.",
          issues: [
            {
              title: "Create detailed wireframes",
              description: "Develop structured layouts defining information hierarchy and content placement.",
              priority: 1,
              labels: ["wireframe", "ux"]
            },
            {
              title: "Develop visual design system",
              description: "Create comprehensive design system including typography, color palette, UI components, and usage guidelines.",
              priority: 1,
              labels: ["design system", "ui"]
            },
            {
              title: "Produce high-fidelity mockups",
              description: "Create detailed visual designs for all required screens, states, and variations.",
              priority: 2,
              labels: ["mockup", "ui"]
            }
          ]
        },
        {
          title: "Prototyping & Testing",
          description: "Create interactive prototypes and validate designs through testing.",
          issues: [
            {
              title: "Build interactive prototype",
              description: "Create clickable prototype demonstrating user flows, interactions, and animations.",
              priority: 2,
              labels: ["prototype", "interaction"]
            },
            {
              title: "Conduct usability testing",
              description: "Test prototype with representative users, observe pain points, and gather feedback.",
              priority: 1,
              labels: ["testing", "ux"]
            },
            {
              title: "Iterate based on findings",
              description: "Refine design based on testing insights, addressing usability issues and user feedback.",
              priority: 2,
              labels: ["iteration", "refinement"]
            }
          ]
        },
        {
          title: "Design Delivery",
          description: "Prepare and deliver final design assets and documentation.",
          issues: [
            {
              title: "Create design specifications",
              description: "Document detailed specifications including measurements, spacing, and styling information for implementation.",
              priority: 1,
              labels: ["documentation", "specification"]
            },
            {
              title: "Prepare asset package",
              description: "Export and organize all design assets in appropriate formats for development team.",
              priority: 1,
              labels: ["assets", "delivery"]
            },
            {
              title: "Create implementation guidelines",
              description: "Document guidance for developers on implementing animations, interactions, and responsive behaviors.",
              priority: 2,
              labels: ["documentation", "implementation"]
            }
          ]
        }
      ]
    };
  }

  /**
   * Creates a generic project plan for any industry.
   */
  private createGenericPlan(params: ProjectPlanGenerationParams): ProjectPlan {
    const { projectName, projectScope } = params;
    
    return {
      projectDescription: `${projectName}: A comprehensive project focusing on ${projectScope}. This initiative will systematically address key objectives while ensuring quality, timeliness, and stakeholder satisfaction.`,
      milestones: [
        {
          title: "Project Initiation",
          description: "Define project parameters, secure resources, and establish governance.",
          issues: [
            {
              title: "Create project charter",
              description: "Document project purpose, objectives, scope, stakeholders, and success criteria.",
              priority: 1,
              labels: ["documentation", "planning"]
            },
            {
              title: "Develop detailed project plan",
              description: "Create comprehensive plan including timeline, dependencies, resources, and budget.",
              priority: 1,
              labels: ["planning"]
            },
            {
              title: "Establish project governance",
              description: "Define roles, responsibilities, communication protocols, and decision-making processes.",
              priority: 2,
              labels: ["governance", "planning"]
            }
          ]
        },
        {
          title: "Requirements & Analysis",
          description: "Gather and analyze detailed requirements to inform project execution.",
          issues: [
            {
              title: "Conduct stakeholder interviews",
              description: "Interview key stakeholders to gather requirements, expectations, and constraints.",
              priority: 1,
              labels: ["requirements", "research"]
            },
            {
              title: "Document detailed requirements",
              description: "Create comprehensive requirements documentation with acceptance criteria.",
              priority: 1,
              labels: ["requirements", "documentation"]
            },
            {
              title: "Perform feasibility analysis",
              description: "Assess technical, operational, and financial feasibility of requirements.",
              priority: 2,
              labels: ["analysis"]
            }
          ]
        },
        {
          title: "Design & Planning",
          description: "Create detailed designs and implementation plans.",
          issues: [
            {
              title: "Develop solution architecture",
              description: "Design high-level solution addressing all requirements and constraints.",
              priority: 1,
              labels: ["design", "architecture"]
            },
            {
              title: "Create detailed work breakdown",
              description: "Break down work into manageable tasks with estimates and assignments.",
              priority: 1,
              labels: ["planning"]
            },
            {
              title: "Establish quality assurance plan",
              description: "Define QA approach, testing methodologies, and acceptance criteria.",
              priority: 2,
              labels: ["quality", "planning"]
            }
          ]
        },
        {
          title: "Implementation",
          description: "Execute project activities according to plan.",
          issues: [
            {
              title: "Execute core deliverables",
              description: "Complete primary project deliverables according to requirements and specifications.",
              priority: 1,
              labels: ["implementation", "core"]
            },
            {
              title: "Perform regular progress reviews",
              description: "Conduct scheduled reviews to assess progress, quality, and alignment with objectives.",
              priority: 2,
              labels: ["monitoring", "review"]
            },
            {
              title: "Manage issues and risks",
              description: "Identify, document, and address emerging issues and risks throughout implementation.",
              priority: 1,
              labels: ["risk", "management"]
            }
          ]
        },
        {
          title: "Testing & Validation",
          description: "Verify project deliverables meet requirements and quality standards.",
          issues: [
            {
              title: "Conduct comprehensive testing",
              description: "Test all deliverables against requirements and quality standards.",
              priority: 1,
              labels: ["testing", "quality"]
            },
            {
              title: "Facilitate stakeholder reviews",
              description: "Present deliverables to stakeholders for review and feedback.",
              priority: 2,
              labels: ["review", "stakeholder"]
            },
            {
              title: "Document validation results",
              description: "Record testing outcomes, stakeholder feedback, and validation status.",
              priority: 2,
              labels: ["documentation", "testing"]
            }
          ]
        },
        {
          title: "Deployment & Closure",
          description: "Deploy final deliverables and formally close the project.",
          issues: [
            {
              title: "Execute deployment plan",
              description: "Implement deployment activities according to established plan.",
              priority: 1,
              labels: ["deployment", "implementation"]
            },
            {
              title: "Transfer project documentation",
              description: "Hand over all relevant documentation to appropriate stakeholders.",
              priority: 2,
              labels: ["documentation", "handover"]
            },
            {
              title: "Conduct project retrospective",
              description: "Facilitate session to review project success, challenges, and lessons learned.",
              priority: 2,
              labels: ["closure", "retrospective"]
            }
          ]
        }
      ]
    };
  }

  /**
   * Generates a detailed description for an issue with specific information.
   */
  private generateDetailedIssueDescription(baseDescription: string, planParams: ProjectPlanGenerationParams): string {
    // Add context-specific details to the base description
    
    let enhancedDescription = `## Overview\n${baseDescription}\n\n`;
    
    enhancedDescription += `## Context\nThis task is part of the ${planParams.projectName} project, focusing on ${planParams.projectScope}.\n\n`;
    
    // Add technical details if available
    if (planParams.technicalRequirements && planParams.technicalRequirements.length > 0) {
      enhancedDescription += `## Technical Considerations\n`;
      planParams.technicalRequirements.forEach(req => {
        enhancedDescription += `- Consider ${req} when implementing this task\n`;
      });
      enhancedDescription += '\n';
    }
    
    // Add detailed implementation instructions
    enhancedDescription += `## Implementation Instructions\n`;
    enhancedDescription += `1. Begin by analyzing the current state and requirements thoroughly\n`;
    enhancedDescription += `2. Create a detailed implementation plan before writing any code\n`;
    enhancedDescription += `3. Follow established project patterns and coding standards\n`;
    enhancedDescription += `4. Document your approach and any important decisions\n`;
    enhancedDescription += `5. Write tests to verify your implementation meets requirements\n`;
    enhancedDescription += `6. Request feedback early to avoid late-stage revisions\n\n`;
    
    // Add specific considerations based on the task type (extracted from labels if available)
    enhancedDescription += `## Specific Considerations\n`;
    
    // Add specific considerations based on content in the description
    if (baseDescription.toLowerCase().includes('database') || baseDescription.toLowerCase().includes('schema')) {
      enhancedDescription += `### Database Work\n`;
      enhancedDescription += `- Ensure proper indexing for optimal query performance\n`;
      enhancedDescription += `- Consider data validation and constraints\n`;
      enhancedDescription += `- Document schema changes and migration steps\n`;
      enhancedDescription += `- Plan for backward compatibility if needed\n\n`;
    }
    
    if (baseDescription.toLowerCase().includes('api') || baseDescription.toLowerCase().includes('endpoint')) {
      enhancedDescription += `### API Development\n`;
      enhancedDescription += `- Follow RESTful principles or GraphQL best practices\n`;
      enhancedDescription += `- Implement proper error handling and status codes\n`;
      enhancedDescription += `- Document the API with examples\n`;
      enhancedDescription += `- Consider rate limiting and security aspects\n\n`;
    }
    
    if (baseDescription.toLowerCase().includes('ui') || baseDescription.toLowerCase().includes('interface') || 
        baseDescription.toLowerCase().includes('design') || baseDescription.toLowerCase().includes('frontend')) {
      enhancedDescription += `### UI Implementation\n`;
      enhancedDescription += `- Ensure responsive design works on all target devices\n`;
      enhancedDescription += `- Implement proper loading states and error handling\n`;
      enhancedDescription += `- Follow accessibility guidelines (WCAG 2.1)\n`;
      enhancedDescription += `- Test across different browsers\n\n`;
    }
    
    if (baseDescription.toLowerCase().includes('test') || baseDescription.toLowerCase().includes('qa')) {
      enhancedDescription += `### Testing Work\n`;
      enhancedDescription += `- Create comprehensive test cases covering edge cases\n`;
      enhancedDescription += `- Document test procedures for manual testing\n`;
      enhancedDescription += `- Consider performance and load testing aspects\n`;
      enhancedDescription += `- Verify compatibility with target environments\n\n`;
    }
    
    if (baseDescription.toLowerCase().includes('security') || baseDescription.toLowerCase().includes('auth')) {
      enhancedDescription += `### Security Considerations\n`;
      enhancedDescription += `- Follow OWASP security best practices\n`;
      enhancedDescription += `- Implement proper authentication and authorization\n`;
      enhancedDescription += `- Consider input validation and data sanitization\n`;
      enhancedDescription += `- Document security measures implemented\n\n`;
    }
    
    // Add comprehensive acceptance criteria section
    enhancedDescription += `## Acceptance Criteria\n`;
    enhancedDescription += `### Functional Requirements\n`;
    enhancedDescription += `- Functionality works as described in the overview\n`;
    enhancedDescription += `- All edge cases are handled gracefully\n`;
    enhancedDescription += `- Performance meets established benchmarks\n`;
    
    enhancedDescription += `\n### Quality Requirements\n`;
    enhancedDescription += `- Code follows project coding standards and patterns\n`;
    enhancedDescription += `- Comprehensive test coverage is provided\n`;
    enhancedDescription += `- Documentation is complete and up-to-date\n`;
    enhancedDescription += `- No new linting errors or warnings are introduced\n`;
    
    enhancedDescription += `\n### Delivery Requirements\n`;
    enhancedDescription += `- Pull request includes detailed description of changes\n`;
    enhancedDescription += `- CI/CD pipeline passes all checks\n`;
    enhancedDescription += `- Code has been peer-reviewed before merging\n`;
    enhancedDescription += `- Changes have been demonstrated to stakeholders if applicable\n\n`;
    
    // Add dependencies section
    enhancedDescription += `## Dependencies\n`;
    enhancedDescription += `- Note any dependencies on other tasks or team members here\n`;
    enhancedDescription += `- Update this section as dependencies are identified or resolved\n\n`;
    
    // Add estimation and tracking section
    enhancedDescription += `## Time Tracking\n`;
    enhancedDescription += `- Initial estimate: [TBD] hours\n`;
    enhancedDescription += `- Track time spent on research, implementation, testing, and review\n`;
    enhancedDescription += `- Document any significant deviations from estimates\n\n`;
    
    // Add additional resources section
    enhancedDescription += `## Additional Resources\n`;
    enhancedDescription += `- Refer to project documentation for established patterns\n`;
    enhancedDescription += `- Consult with team members who have domain expertise\n`;
    enhancedDescription += `- Update this section with links to relevant resources\n`;
    
    return enhancedDescription;
  }
}