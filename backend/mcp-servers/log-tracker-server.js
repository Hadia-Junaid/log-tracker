#!/usr/bin/env node

/**
 * Example MCP Server for Log Tracker Application
 * This server provides tools for interacting with the log tracker system
 */

const readline = require('readline');

// MCP Protocol Version
const PROTOCOL_VERSION = '2024-11-05';

// Tool definitions
const tools = [
  {
    name: 'get_logs',
    description: 'Retrieve logs with filtering and pagination',
    inputSchema: {
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
    name: 'get_applications',
    description: 'Retrieve all applications with optional filtering',
    inputSchema: {
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
    name: 'get_dashboard_stats',
    description: 'Get dashboard statistics including active apps, pinned apps, and at-risk apps',
    inputSchema: {
      type: 'object',
      properties: {
        includePinnedApps: {
          type: 'boolean',
          description: 'Include pinned applications in response'
        },
        includeActiveApps: {
          type: 'boolean',
          description: 'Include active applications in response'
        },
        includeAtRiskApps: {
          type: 'boolean',
          description: 'Include at-risk applications in response'
        }
      }
    }
  },
  {
    name: 'search_logs',
    description: 'Search logs with advanced filtering and text search',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for log content'
        },
        applications: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of application IDs to search in'
        },
        levels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of log levels to include (error, warn, info, debug)'
        },
        timeRange: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' }
          },
          description: 'Time range for search'
        }
      }
    }
  },
  {
    name: 'get_log_analytics',
    description: 'Get analytics and insights from log data',
    inputSchema: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: ['error_rate', 'response_time', 'throughput', 'user_activity'],
          description: 'Type of metric to analyze'
        },
        timeRange: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' }
          },
          description: 'Time range for analysis'
        },
        groupBy: {
          type: 'string',
          enum: ['hour', 'day', 'week', 'month', 'application'],
          description: 'Grouping for analytics'
        }
      }
    }
  }
];

// Mock data for demonstration
const mockData = {
  logs: [
    { id: '1', application: 'web-app', level: 'error', message: 'Database connection failed', timestamp: new Date().toISOString() },
    { id: '2', application: 'api-service', level: 'info', message: 'Request processed successfully', timestamp: new Date().toISOString() },
    { id: '3', application: 'web-app', level: 'warn', message: 'High memory usage detected', timestamp: new Date().toISOString() }
  ],
  applications: [
    { id: '1', name: 'Web Application', status: 'active', hostname: 'web.example.com' },
    { id: '2', name: 'API Service', status: 'active', hostname: 'api.example.com' },
    { id: '3', name: 'Database', status: 'active', hostname: 'db.example.com' }
  ]
};

// Tool implementations
const toolImplementations = {
  get_logs: async (args) => {
    const { page = 1, limit = 10, applicationId, level, search } = args;
    
    let filteredLogs = [...mockData.logs];
    
    if (applicationId) {
      filteredLogs = filteredLogs.filter(log => log.application === applicationId);
    }
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    if (search) {
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    
    return {
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total: filteredLogs.length,
        totalPages: Math.ceil(filteredLogs.length / limit)
      }
    };
  },

  get_applications: async (args) => {
    const { page = 1, limit = 10, search, status } = args;
    
    let filteredApps = [...mockData.applications];
    
    if (search) {
      filteredApps = filteredApps.filter(app => 
        app.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (status) {
      filteredApps = filteredApps.filter(app => app.status === status);
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedApps = filteredApps.slice(startIndex, endIndex);
    
    return {
      applications: paginatedApps,
      pagination: {
        page,
        limit,
        total: filteredApps.length,
        totalPages: Math.ceil(filteredApps.length / limit)
      }
    };
  },

  get_dashboard_stats: async (args) => {
    const { includePinnedApps = true, includeActiveApps = true, includeAtRiskApps = true } = args;
    
    const stats = {
      totalApplications: mockData.applications.length,
      totalLogs: mockData.logs.length,
      errorCount: mockData.logs.filter(log => log.level === 'error').length,
      warningCount: mockData.logs.filter(log => log.level === 'warn').length
    };
    
    if (includePinnedApps) {
      stats.pinnedApps = mockData.applications.slice(0, 2);
    }
    
    if (includeActiveApps) {
      stats.activeApps = mockData.applications.filter(app => app.status === 'active');
    }
    
    if (includeAtRiskApps) {
      stats.atRiskApps = mockData.applications.filter(app => 
        mockData.logs.some(log => log.application === app.id && log.level === 'error')
      );
    }
    
    return stats;
  },

  search_logs: async (args) => {
    const { query, applications, levels, timeRange } = args;
    
    let searchResults = [...mockData.logs];
    
    if (query) {
      searchResults = searchResults.filter(log => 
        log.message.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    if (applications && applications.length > 0) {
      searchResults = searchResults.filter(log => 
        applications.includes(log.application)
      );
    }
    
    if (levels && levels.length > 0) {
      searchResults = searchResults.filter(log => 
        levels.includes(log.level)
      );
    }
    
    return {
      results: searchResults,
      total: searchResults.length,
      query: args
    };
  },

  get_log_analytics: async (args) => {
    const { metric, timeRange, groupBy } = args;
    
    // Mock analytics data
    const analytics = {
      metric,
      timeRange,
      groupBy,
      data: [
        { period: '2024-01-01', value: 150, count: 10 },
        { period: '2024-01-02', value: 200, count: 15 },
        { period: '2024-01-03', value: 175, count: 12 }
      ],
      summary: {
        total: 525,
        average: 175,
        trend: 'increasing'
      }
    };
    
    return analytics;
  }
};

// MCP Server implementation
class MCPServer {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async sendResponse(id, result, error = null) {
    const response = {
      jsonrpc: '2.0',
      id,
      result: error ? null : result,
      error: error ? { code: -1, message: error } : null
    };
    
    console.log(JSON.stringify(response));
  }

  async handleInitialize(params) {
    return {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'log-tracker-mcp-server',
        version: '1.0.0'
      }
    };
  }

  async handleListTools() {
    return {
      tools: tools
    };
  }

  async handleCallTool(params) {
    const { name, arguments: args } = params;
    
    if (!toolImplementations[name]) {
      throw new Error(`Tool '${name}' not found`);
    }
    
    try {
      const result = await toolImplementations[name](args);
      return result;
    } catch (error) {
      throw new Error(`Error executing tool '${name}': ${error.message}`);
    }
  }

  async handleRequest(message) {
    const { id, method, params } = message;
    
    try {
      let result;
      
      switch (method) {
        case 'initialize':
          result = await this.handleInitialize(params);
          break;
          
        case 'tools/list':
          result = await this.handleListTools();
          break;
          
        case 'tools/call':
          result = await this.handleCallTool(params);
          break;
          
        default:
          throw new Error(`Unknown method: ${method}`);
      }
      
      await this.sendResponse(id, result);
      
    } catch (error) {
      await this.sendResponse(id, null, error.message);
    }
  }

  async start() {
    console.error('Log Tracker MCP Server started');
    
    this.rl.on('line', async (line) => {
      try {
        const message = JSON.parse(line);
        await this.handleRequest(message);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    this.rl.on('close', () => {
      console.error('MCP Server shutting down');
      process.exit(0);
    });
  }
}

// Start the server
const server = new MCPServer();
server.start().catch(error => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
}); 