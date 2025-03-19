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
          title: "Requirements & Planning",
          description: "Define detailed requirements, create technical specifications, and establish project timeline.",
          issues: [
            {
              title: "Create detailed user stories",
              description: "Document comprehensive user stories with acceptance criteria for all main features.",
              priority: 2,
              labels: ["documentation", "planning"]
            },
            {
              title: "Define technical architecture",
              description: `Design the system architecture considering ${technicalRequirements.join(', ') || 'all technical requirements'}. Include diagrams, API specifications, and data models.`,
              priority: 1,
              labels: ["architecture", "planning"]
            },
            {
              title: "Set up development environment",
              description: "Configure development, staging, and production environments with CI/CD pipelines.",
              priority: 2,
              estimatedHours: 8,
              labels: ["devops"]
            }
          ]
        },
        {
          title: "Design & Prototyping",
          description: "Create UI/UX designs and interactive prototypes for key user flows.",
          issues: [
            {
              title: "Create wireframes for all main screens",
              description: "Design low-fidelity wireframes for all core user flows and get stakeholder approval.",
              priority: 2,
              estimatedHours: 12,
              labels: ["design", "ux"]
            },
            {
              title: "Develop high-fidelity mockups",
              description: "Create detailed visual designs based on approved wireframes, including responsive variations.",
              priority: 2,
              estimatedHours: 16,
              labels: ["design", "ui"]
            },
            {
              title: "Build interactive prototype",
              description: "Create clickable prototype demonstrating key user flows for testing and stakeholder review.",
              priority: 3,
              estimatedHours: 10,
              labels: ["prototype", "ux"]
            }
          ]
        },
        {
          title: "Core Development",
          description: "Implement the fundamental features and establish the technical foundation.",
          issues: [
            {
              title: "Set up database schema and migrations",
              description: "Design and implement database structure with proper indexing, relationships, and optimization.",
              priority: 1,
              estimatedHours: 8,
              labels: ["backend", "database"]
            },
            {
              title: "Implement authentication system",
              description: "Create secure user authentication with role-based permissions, password policies, and account recovery.",
              priority: 1,
              estimatedHours: 12,
              labels: ["security", "backend"]
            },
            {
              title: "Develop core API endpoints",
              description: "Implement RESTful or GraphQL API endpoints for core functionality with proper validation and error handling.",
              priority: 1,
              estimatedHours: 20,
              labels: ["backend", "api"]
            }
          ]
        },
        {
          title: "Feature Implementation",
          description: "Build out all planned features according to specifications.",
          issues: [
            {
              title: "Implement user dashboard",
              description: "Create the main user dashboard showing key metrics, recent activity, and quick actions.",
              priority: 2,
              estimatedHours: 14,
              labels: ["frontend", "feature"]
            },
            {
              title: "Build search and filtering functionality",
              description: "Implement advanced search with filters, sorting options, and saved searches capability.",
              priority: 2,
              estimatedHours: 10,
              labels: ["frontend", "feature"]
            },
            {
              title: "Create reporting module",
              description: "Develop customizable reports with data visualization, export options, and scheduling features.",
              priority: 3,
              estimatedHours: 18,
              labels: ["frontend", "data", "feature"]
            }
          ]
        },
        {
          title: "Testing & Quality Assurance",
          description: "Ensure the application meets all requirements and functions correctly.",
          issues: [
            {
              title: "Write unit tests for core functionality",
              description: "Create comprehensive test suite covering all critical paths and edge cases.",
              priority: 1,
              estimatedHours: 16,
              labels: ["testing", "quality"]
            },
            {
              title: "Perform integration testing",
              description: "Test interactions between different components and external services.",
              priority: 2,
              estimatedHours: 12,
              labels: ["testing", "quality"]
            },
            {
              title: "Conduct security audit",
              description: "Perform thorough security assessment including penetration testing and vulnerability scanning.",
              priority: 1,
              estimatedHours: 8,
              labels: ["security", "quality"]
            }
          ]
        },
        {
          title: "Deployment & Launch",
          description: "Prepare for and execute the product launch.",
          issues: [
            {
              title: "Create deployment documentation",
              description: "Document detailed deployment procedures, system requirements, and configuration instructions.",
              priority: 2,
              estimatedHours: 6,
              labels: ["documentation", "devops"]
            },
            {
              title: "Perform load testing",
              description: "Test system performance under expected and peak loads, identify bottlenecks.",
              priority: 2,
              estimatedHours: 8,
              labels: ["testing", "performance"]
            },
            {
              title: "Execute production deployment",
              description: "Deploy to production environment following established procedures with rollback strategy.",
              priority: 1,
              estimatedHours: 4,
              labels: ["devops", "release"]
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
    
    // Add acceptance criteria section
    enhancedDescription += `## Acceptance Criteria\n- Functionality works as described\n- Code follows project standards\n- Documentation is updated\n- Tests are written and passing\n\n`;
    
    // Add additional resources section
    enhancedDescription += `## Additional Resources\n- Refer to project documentation for more details\n- Consult with team members if clarification is needed\n`;
    
    return enhancedDescription;
  }
}