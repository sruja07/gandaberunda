export interface TaskStep {
  step_id: string;
  title: string;
  tool: string;
  args: Record<string, any>;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REQUIRES_APPROVAL';
  requires_approval: boolean;
  risk_level: 'LOW' | 'HIGH';
  result?: string;
}
