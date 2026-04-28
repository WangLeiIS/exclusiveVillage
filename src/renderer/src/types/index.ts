export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Team {
  id: number;
  name: string;
  description: string | null;
  agent_count?: number;
}

export interface Agent {
  id: number;
  name: string;
  role: string;
  class: string;
  status: string;
  is_vocal: boolean;
  coins: number;
  goal_description: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateAgentParams {
  name: string;
  role: string;
  class: string;
  is_vocal: boolean;
  goal_description: string;
}

export interface CwdInfo {
  path: string;
  valid: boolean;
}
