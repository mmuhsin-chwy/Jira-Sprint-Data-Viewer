export interface SprintTask {
  issueId: string;
  issueKey: string;
  title: string;
  assignee: string;
  assigneeAccountId: string | null;
  status: string;
  statusCategory: string | null;
  storyPoints: number | null;
  sprintName: string;
  issueUrl: string;
}

export interface AppConfig {
  jiraBaseUrl: string;
  boardId: number | null;
  /** Empty = show all projects on the board */
  projectKeys: string[];
  storyPointsFieldId: string;
}

export interface SprintReportMeta {
  userDisplayName: string;
  boardName: string;
  sprintName: string;
  sprintId?: number | null;
  sprintState?: string | null;
  sprintStartDate?: string | null;
  sprintEndDate?: string | null;
  totalTasksLoaded?: number;
}
