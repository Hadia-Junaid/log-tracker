import OpenAI from 'openai';
import axios from 'axios';
import config from 'config';
import logger  from '../utils/logger';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.get<string>('openai.apiKey'),
});

// Define function schemas for all available API endpoints
const functionDefinitions = [
  {
    name: 'get_logs',
    description: 'Retrieve logs with optional filtering and pagination',
    parameters: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)'
        },
        limit: {
          type: 'number',
          description: 'Number of logs per page (default: 10)'
        },
        applicationId: {
          type: 'string',
          description: 'Filter logs by application ID'
        },
        startDate: {
          type: 'string',
          description: 'Start date for log filtering (ISO format)'
        },
        endDate: {
          type: 'string',
          description: 'End date for log filtering (ISO format)'
        },
        level: {
          type: 'string',
          description: 'Filter logs by level (error, warn, info, debug)'
        },
        search: {
          type: 'string',
          description: 'Search term to filter logs'
        }
      }
    }
  },
  {
    name: 'get_log_activity',
    description: 'Get aggregated log activity data for charts',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date for activity data (ISO format)'
        },
        endDate: {
          type: 'string',
          description: 'End date for activity data (ISO format)'
        },
        interval: {
          type: 'string',
          description: 'Time interval for aggregation (hour, day, week, month)'
        }
      }
    }
  },
  {
    name: 'get_applications',
    description: 'Retrieve all applications with optional filtering',
    parameters: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number for pagination'
        },
        limit: {
          type: 'number',
          description: 'Number of applications per page'
        },
        search: {
          type: 'string',
          description: 'Search term to filter applications'
        },
        status: {
          type: 'string',
          description: 'Filter by application status'
        }
      }
    }
  },
  {
    name: 'get_dashboard_pinned_apps',
    description: 'Get pinned applications for dashboard',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to get pinned apps for (optional - will use authenticated user if not provided)'
        }
      }
    }
  },
  {
    name: 'get_dashboard_active_apps',
    description: 'Get active applications for dashboard',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to get active apps for (optional - will use authenticated user if not provided)'
        }
      }
    }
  },
  {
    name: 'get_dashboard_at_risk_apps',
    description: 'Get at-risk applications for dashboard',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to get at-risk apps for (optional - will use authenticated user if not provided)'
        }
      }
    }
  },
  {
    name: 'get_user_groups',
    description: 'Retrieve user groups (admin only)',
    parameters: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number for pagination'
        },
        limit: {
          type: 'number',
          description: 'Number of groups per page'
        },
        search: {
          type: 'string',
          description: 'Search term to filter groups'
        }
      }
    }
  },
  {
    name: 'get_user_settings',
    description: 'Get user settings',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to get settings for (optional - will use authenticated user if not provided)'
        }
      }
    }
  },
  {
    name: 'get_at_risk_rules',
    description: 'Get all at-risk rules (admin only)',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_data_retention',
    description: 'Get data retention settings',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
];

// Function implementations that call the actual API endpoints
const functionImplementations = {
  async get_logs(params: any, authToken: string, authenticatedUserId?: string) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.applicationId) queryParams.append('applicationId', params.applicationId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.level) queryParams.append('level', params.level);
      if (params.search) queryParams.append('search', params.search);

      const response = await axios.get(`${config.get<string>('baseUrl')}/api/logs?${queryParams}`, {
        headers: {
          'Cookie': `jwt=${authToken}`
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error calling get_logs function:', error);
      throw error;
    }
  },

  async get_log_activity(params: any, authToken: string, authenticatedUserId?: string) {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.interval) queryParams.append('interval', params.interval);

      const response = await axios.get(`${config.get<string>('baseUrl')}/api/logs/activity?${queryParams}`, {
        headers: {
          'Cookie': `jwt=${authToken}`
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error calling get_log_activity function:', error);
      throw error;
    }
  },

  async get_applications(params: any, authToken: string, authenticatedUserId?: string) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);

      const response = await axios.get(`${config.get<string>('baseUrl')}/api/applications?${queryParams}`, {
        headers: {
          'Cookie': `jwt=${authToken}`
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error calling get_applications function:', error);
      throw error;
    }
  },

  async get_dashboard_pinned_apps(params: any, authToken: string, authenticatedUserId?: string) {
    try {
      // Use the userId from params if provided, otherwise use the authenticated user's ID
      const userId = params.userId || authenticatedUserId;
      const url = userId 
        ? `${config.get<string>('baseUrl')}/api/dashboard/pinned/${userId}`
        : `${config.get<string>('baseUrl')}/api/dashboard/pinned`;
      
      const response = await axios.get(url, {
        headers: {
          'Cookie': `jwt=${authToken}`
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error calling get_dashboard_pinned_apps function:', error);
      throw error;
    }
  },

  async get_dashboard_active_apps(params: any, authToken: string, authenticatedUserId?: string) {
    try {
      // Use the userId from params if provided, otherwise use the authenticated user's ID
      const userId = params.userId || authenticatedUserId;
      const url = userId 
        ? `${config.get<string>('baseUrl')}/api/dashboard/active/${userId}`
        : `${config.get<string>('baseUrl')}/api/dashboard/active`;
      
      const response = await axios.get(url, {
        headers: {
          'Cookie': `jwt=${authToken}`
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error calling get_dashboard_active_apps function:', error);
      throw error;
    }
  },

  async get_dashboard_at_risk_apps(params: any, authToken: string, authenticatedUserId?: string) {
    try {
      // Use the userId from params if provided, otherwise use the authenticated user's ID
      const userId = params.userId || authenticatedUserId;
      const url = userId 
        ? `${config.get<string>('baseUrl')}/api/dashboard/atrisk/${userId}`
        : `${config.get<string>('baseUrl')}/api/dashboard/atrisk`;
      
      const response = await axios.get(url, {
        headers: {
          'Cookie': `jwt=${authToken}`
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error calling get_dashboard_at_risk_apps function:', error);
      throw error;
    }
  },

  async get_user_groups(params: any, authToken: string, authenticatedUserId?: string) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);

      const response = await axios.get(`${config.get<string>('baseUrl')}/api/user-groups?${queryParams}`, {
        headers: {
          'Cookie': `jwt=${authToken}`
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error calling get_user_groups function:', error);
      throw error;
    }
  },

  async get_user_settings(params: any, authToken: string, authenticatedUserId?: string) {
    try {
      // Use the userId from params if provided, otherwise use the authenticated user's ID
      const userId = params.userId || authenticatedUserId;
      const url = userId 
        ? `${config.get<string>('baseUrl')}/api/settings/${userId}`
        : `${config.get<string>('baseUrl')}/api/settings`;
      
      const response = await axios.get(url, {
        headers: {
          'Cookie': `jwt=${authToken}`
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error calling get_user_settings function:', error);
      throw error;
    }
  },

  async get_at_risk_rules(params: any, authToken: string, authenticatedUserId?: string) {
    try {
      const response = await axios.get(`${config.get<string>('baseUrl')}/api/at-risk-rules`, {
        headers: {
          'Cookie': `jwt=${authToken}`
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error calling get_at_risk_rules function:', error);
      throw error;
    }
  },

  async get_data_retention(params: any, authToken: string, authenticatedUserId?: string) {
    try {
      const response = await axios.get(`${config.get<string>('baseUrl')}/api/data-retention`, {
        headers: {
          'Cookie': `jwt=${authToken}`
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error calling get_data_retention function:', error);
      throw error;
    }
  }
};

export class OpenAIService {
  static async processMessage(
    message: string,
    authToken: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    userId?: string
  ) {
    try {
      const messages = [
        {
          role: 'system' as const,
          content: `You are a helpful AI assistant for a log tracking application. You can help users query logs, applications, dashboard data, user groups, settings, and more. 

Available functions:
- get_logs: Retrieve logs with filtering and pagination
- get_log_activity: Get aggregated log activity data for charts
- get_applications: Retrieve applications with filtering
- get_dashboard_pinned_apps: Get pinned applications for dashboard (automatically uses authenticated user)
- get_dashboard_active_apps: Get active applications for dashboard (automatically uses authenticated user)
- get_dashboard_at_risk_apps: Get at-risk applications for dashboard (automatically uses authenticated user)
- get_user_groups: Retrieve user groups (admin only)
- get_user_settings: Get user settings (automatically uses authenticated user)
- get_at_risk_rules: Get at-risk rules (admin only)
- get_data_retention: Get data retention settings

IMPORTANT: When users ask about their dashboard data (pinned apps, active apps, at-risk apps, settings), automatically use the authenticated user's context. Do NOT ask for user ID - the system will automatically use the logged-in user's information. Simply call the appropriate function without any userId parameter.

Current authenticated user ID: ${userId || 'Not available'}

Always be helpful and provide clear explanations of the data you retrieve. If a user asks for information that requires authentication or admin privileges, inform them appropriately.`
        },
        ...conversationHistory,
        { role: 'user' as const, content: message }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        tools: functionDefinitions.map(def => ({ type: 'function' as const, function: def })),
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1000
      });

      const assistantMessage = response.choices[0].message;
      const toolCalls = assistantMessage.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        const toolResults = [];

        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name as keyof typeof functionImplementations;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          try {
            // Pass authenticated user ID to functions that need it
            const result = await functionImplementations[functionName](functionArgs, authToken, userId);
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool' as const,
              content: JSON.stringify(result)
            });
          } catch (error) {
            logger.error(`Error executing function ${functionName}:`, error);
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool' as const,
              content: JSON.stringify({ error: 'Failed to execute function' })
            });
          }
        }

        // Get the final response with tool results
        const finalResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            ...messages,
            assistantMessage,
            ...toolResults
          ],
          temperature: 0.7,
          max_tokens: 1000
        });

        return {
          response: finalResponse.choices[0].message.content,
          toolCalls: toolCalls.map(tc => ({
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments)
          })),
          tokensUsed: finalResponse.usage?.total_tokens
        };
      }

      return {
        response: assistantMessage.content,
        toolCalls: [],
        tokensUsed: response.usage?.total_tokens
      };
    } catch (error) {
      logger.error('Error processing message with OpenAI:', error);
      throw error;
    }
  }
} 