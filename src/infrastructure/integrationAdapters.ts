export type IntegrationPlatform = 'github' | 'gitlab' | 'azure-devops' | 'bitbucket';
export type WorkItemSystem = 'jira' | 'linear' | 'slack' | 'discord';

export interface IntegrationDescriptor {
  id: IntegrationPlatform | WorkItemSystem;
  name: string;
  enabled: boolean;
  status: 'READY_FOR_CONFIGURATION' | 'DISABLED';
  description: string;
}

export function listIntegrationDescriptors(): IntegrationDescriptor[] {
  return [
    { id: 'github', name: 'GitHub', enabled: false, status: 'READY_FOR_CONFIGURATION', description: 'Preparado para mapear PRs, commits e checks.' },
    { id: 'gitlab', name: 'GitLab', enabled: false, status: 'READY_FOR_CONFIGURATION', description: 'Preparado para merge requests e pipelines.' },
    { id: 'azure-devops', name: 'Azure DevOps', enabled: false, status: 'READY_FOR_CONFIGURATION', description: 'Preparado para pull requests e boards.' },
    { id: 'bitbucket', name: 'Bitbucket', enabled: false, status: 'READY_FOR_CONFIGURATION', description: 'Preparado para pull requests e branches.' },
    { id: 'jira', name: 'Jira', enabled: false, status: 'READY_FOR_CONFIGURATION', description: 'Preparado para vincular findings a issues.' },
    { id: 'linear', name: 'Linear', enabled: false, status: 'READY_FOR_CONFIGURATION', description: 'Preparado para rastrear correções por ticket.' },
    { id: 'slack', name: 'Slack', enabled: false, status: 'READY_FOR_CONFIGURATION', description: 'Preparado para notificar menções e bloqueios.' },
    { id: 'discord', name: 'Discord', enabled: false, status: 'READY_FOR_CONFIGURATION', description: 'Preparado para alertas de review em canais.' }
  ];
}
