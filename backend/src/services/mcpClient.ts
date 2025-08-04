import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import config from 'config';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { mongoMCPManager } from './mongoMCPManager';
import User from '../models/User';
import UserGroup from '../models/UserGroup';
import Application from '../models/Application';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

interface MCPMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface MCPToolCall {
  id: string;
  name: string;
  arguments: any;
}

interface MCPToolResult {
  tool_call_id: string;
  role: 'tool';
  content: string;
}

interface UserContext {
  userId: string;
  userEmail: string;
  userName: string;
  isAdmin: boolean;
  userGroups: string[];
  userGroupDetails: Array<{
    id: string;
    name: string;
    is_admin: boolean;
    assigned_applications: string[];
  }>;
  assignedApplications: string[];
  pinnedApplications: string[];
  assignedApplicationDetails: Array<{
    id: string;
    name: string;
    hostname: string;
    environment: string;
    isActive: boolean;
    description: string;
  }>;
  pinnedApplicationDetails: Array<{
    id: string;
    name: string;
    hostname: string;
    environment: string;
    isActive: boolean;
    description: string;
  }>;
  settings: {
    autoRefresh: boolean;
    autoRefreshTime: number;
    logsPerPage: number;
  };
}

export type AIModel = 'openai-gpt-4o-mini' | 'openai-gpt-4o' | 'gemini-2.0-flash' | 'gemini-2.5-flash' | 'gemini-2.5-pro';

export class MCPClient extends EventEmitter {
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;
  private mcpProcess: ChildProcess | null = null;
  private tools: MCPTool[] = [];
  private isConnected: boolean = false;
  private messageQueue: any[] = [];
  private responseBuffer: string = '';
  private autoConnectMongo: boolean = true;
  private defaultModel: AIModel = 'openai-gpt-4o-mini';

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: config.get<string>('openai.apiKey'),
    });
    
    this.gemini = new GoogleGenerativeAI(config.get<string>('gemini.apiKey'));
    
    // Auto-connect to MongoDB MCP server if enabled
    if (this.autoConnectMongo) {
      this.autoConnectToMongoDB();
    }
  }

  /**
   * Set the default AI model
   */
  setDefaultModel(model: AIModel): void {
    this.defaultModel = model;
  }

  /**
   * Get the default AI model
   */
  getDefaultModel(): AIModel {
    return this.defaultModel;
  }

  /**
   * Get available models
   */
  getAvailableModels(): Array<{ id: AIModel; name: string; provider: string; description: string }> {
    return [
      {
        id: 'openai-gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        description: 'Fast and efficient model for most tasks'
      },
      {
        id: 'openai-gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        description: 'Most capable model with advanced reasoning'
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        provider: 'Google',
        description: 'Fast and efficient Gemini model'
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'Google',
        description: 'Advanced Gemini model with function calling'
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'Google',
        description: 'Most capable Gemini model with advanced reasoning'
      }
    ];
  }

  /**
   * Get user context for access control
   */
  private async getUserContext(userId: string): Promise<UserContext | undefined> {
    try {
      const user = await User.findById(userId).lean();
      if (!user) {
        console.log(`User not found: ${userId}`);
        return undefined;
      }

      // Get user's groups
      const userGroups = await UserGroup.find({ 
        members: user._id, 
        is_active: true 
      }).lean();

      // Check if user is admin
      const isAdmin = userGroups.some(group => group.is_admin);

      // Get assigned applications from user groups
      const assignedAppIds = userGroups.flatMap(group => 
        group.assigned_applications.map(id => id.toString())
      );

      // For non-admin users, fetch application details via API calls
      let assignedApplicationDetails: Array<{
        id: string;
        name: string;
        hostname: string;
        environment: string;
        isActive: boolean;
        description: string;
      }> = [];

      let pinnedApplicationDetails: Array<{
        id: string;
        name: string;
        hostname: string;
        environment: string;
        isActive: boolean;
        description: string;
      }> = [];

      if (!isAdmin) {
        // Fetch assigned application details
        if (assignedAppIds.length > 0) {
          const assignedApps = await Application.find({
            _id: { $in: assignedAppIds }
          }).lean();
          
          assignedApplicationDetails = assignedApps.map(app => ({
            id: app._id.toString(),
            name: app.name,
            hostname: app.hostname,
            environment: app.environment,
            isActive: app.isActive,
            description: app.description
          }));
        }

        // Fetch pinned application details
        if (user.pinned_applications && user.pinned_applications.length > 0) {
          const pinnedApps = await Application.find({
            _id: { $in: user.pinned_applications }
          }).lean();
          
          pinnedApplicationDetails = pinnedApps.map(app => ({
            id: app._id.toString(),
            name: app.name,
            hostname: app.hostname,
            environment: app.environment,
            isActive: app.isActive,
            description: app.description
          }));
        }
      }

      return {
        userId: user._id.toString(),
        userEmail: user.email,
        userName: user.name,
        isAdmin,
        userGroups: userGroups.map(g => g._id.toString()),
        userGroupDetails: userGroups.map(group => ({
          id: group._id.toString(),
          name: group.name,
          is_admin: group.is_admin,
          assigned_applications: group.assigned_applications.map(id => id.toString())
        })),
        assignedApplications: assignedAppIds,
        pinnedApplications: user.pinned_applications?.map(id => id.toString()) || [],
        assignedApplicationDetails,
        pinnedApplicationDetails,
        settings: user.settings || {
          autoRefresh: false,
          autoRefreshTime: 30,
          logsPerPage: 25
        }
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return undefined;
    }
  }

  
  /**
   * Convert string IDs to MongoDB ObjectID format for MCP server
   */
  private convertToObjectIds(stringIds: string[]): any[] {
    return stringIds.map(id => ({ $oid: id }));
  }

  /**
   * Convert single string ID to MongoDB ObjectID format for MCP server
   */
  private convertToObjectId(stringId: string): any {
    return { $oid: stringId };
  }

  /**
   * Apply access control filters to queries
   */
  private async applyAccessControl(userContext: UserContext, toolName: string, arguments_: any): Promise<any> {
    // Admin users get full access
    if (userContext.isAdmin) {
      return arguments_;
    }

    // Apply filters for non-admin users
    if (toolName === 'find') {
      const { database, collection, filter = {} } = arguments_;
      
      if (database === 'log-tracker' || database === 'test') {
        if (collection === 'applications') {
          // Users can only see applications assigned to their groups
          return {
            ...arguments_,
            filter: {
              ...filter,
              _id: { $in: this.convertToObjectIds(userContext.assignedApplications) }
            }
          };
        }
        
        if (collection === 'usergroups') {
          // Users can only see groups they belong to (members array contains user ID)
          return {
            ...arguments_,
            filter: {
              ...filter,
              members: this.convertToObjectId(userContext.userId)
            }
          };
        }
        
        if (collection === 'users') {
          // Users can only see their own user data
          return {
            ...arguments_,
            filter: {
              ...filter,
              _id: this.convertToObjectId(userContext.userId)
            }
          };
        }
        
        if (collection === 'logs') {
          // Users can only see logs for their assigned applications
          return {
            ...arguments_,
            filter: {
              ...filter,
              application_id: { $in: this.convertToObjectIds(userContext.assignedApplications) }
            }
          };
        }
      }
    }

    if (toolName === 'count') {
      const { database, collection, query = {} } = arguments_;
      
      if (database === 'log-tracker') {
        if (collection === 'applications') {
          return {
            ...arguments_,
            query: {
              ...query,
              _id: { $in: this.convertToObjectIds(userContext.assignedApplications) }
            }
          };
        }
        
        if (collection === 'usergroups') {
          return {
            ...arguments_,
            query: {
              ...query,
              members: this.convertToObjectId(userContext.userId)
            }
          };
        }
        
        if (collection === 'users') {
          return {
            ...arguments_,
            query: {
              ...query,
              _id: this.convertToObjectId(userContext.userId)
            }
          };
        }
        
        if (collection === 'logs') {
          return {
            ...arguments_,
            query: {
              ...query,
              application_id: { $in: this.convertToObjectIds(userContext.assignedApplications) }
            }
          };
        }
      }
    }

    // Handle update-many operations for pinning/unpinning applications
    if (toolName === 'update-many') {
      const { database, collection, filter = {}, update = {} } = arguments_;
      
      if (database === 'log-tracker' || database === 'test') {
        if (collection === 'users') {
          // Users can only update their own user data (for pinning/unpinning applications)
          return {
            ...arguments_,
            filter: {
              ...filter,
              _id: this.convertToObjectId(userContext.userId)
            }
          };
        }
        
        if (collection === 'applications') {
          // Users can only update applications assigned to their groups
          return {
            ...arguments_,
            filter: {
              ...filter,
              _id: { $in: this.convertToObjectIds(userContext.assignedApplications) }
            }
          };
        }
      }
    }

    return arguments_;
  }

  /**
   * Automatically connect to MongoDB MCP server
   */
  private async autoConnectToMongoDB(): Promise<void> {
    try {
      console.log('🚀 Auto-connecting to MongoDB MCP server...');
      
      // Start the MongoDB MCP server
      console.log('📡 Starting MongoDB MCP server...');
      await mongoMCPManager.startMCPServer();
      console.log('📡 MongoDB MCP server start completed');
      
      // Check if the server is actually running
      const isRunning = mongoMCPManager.isServerRunning();
      console.log('🔍 Server running check:', isRunning);
      
      if (!isRunning) {
        console.warn('❌ MongoDB MCP server is not running - continuing without MCP');
        return;
      }
      
      // Get the server process for communication
      const mongoServerProcess = mongoMCPManager.getServerProcess();
      console.log('🔍 Got server process:', !!mongoServerProcess);
      
      if (mongoServerProcess) {
        this.mcpProcess = mongoServerProcess;
        console.log('✅ Set MCP process');
        
        // Set up communication with the MongoDB MCP server
        console.log('🔧 Setting up MCP server communication...');
        this.setupMCPServerCommunication();
        console.log('✅ MCP server communication setup complete');
        
        // Add a delay to ensure the server is fully ready before initializing
        console.log('⏳ Waiting for MongoDB MCP server to be fully ready...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        console.log('✅ Wait complete, proceeding with initialization');
        
        try {
          // Initialize the connection
          console.log('🔧 Initializing MCP connection...');
          await this.initialize();
          console.log('✅ MCP connection initialized');
          
          // List available tools
          console.log('🔧 Listing available tools...');
          await this.listTools();
          console.log('✅ Tools listed successfully');
          
          this.isConnected = true;
          console.log('✅ Successfully auto-connected to MongoDB MCP server');
          this.emit('connected', { type: 'mongodb', tools: this.tools.map(t => t.name) });
          
        } catch (initError) {
          console.error('❌ Failed to initialize MCP connection:', initError);
          this.isConnected = false;
        }
        
      } else {
        console.warn('❌ MongoDB MCP server process not available - continuing without MCP');
      }
      
    } catch (error) {
      console.error('❌ Failed to auto-connect to MongoDB MCP server:', error);
      this.emit('error', error);
      // Don't throw the error - just log it and continue without MCP
    }
  }

  /**
   * Set up communication with the MCP server
   */
  private setupMCPServerCommunication(): void {
    if (!this.mcpProcess) return;

    // Handle stdout from the server
    this.mcpProcess.stdout?.on('data', (data) => {
      this.handleServerOutput(data.toString());
    });

    // Handle stderr from the server
    this.mcpProcess.stderr?.on('data', (data) => {
      console.error('MCP Server Error:', data.toString());
    });

    // Handle process exit
    this.mcpProcess.on('exit', (code) => {
      console.log(`MCP Server exited with code ${code}`);
      this.isConnected = false;
      this.emit('disconnected');
    });
  }

  /**
   * Connect to an MCP server (manual connection)
   */
  async connectToServer(serverScriptPath: string): Promise<void> {
    try {
      const isJs = serverScriptPath.endsWith('.js');
      const isPy = serverScriptPath.endsWith('.py');
      
      if (!isJs && !isPy) {
        throw new Error('Server script must be a .js or .py file');
      }

      const command = isPy ? 'python' : 'node';
      
      // Spawn the MCP server process
      this.mcpProcess = spawn('npx', [
      '-y',
      'mongodb-mcp-server@latest',
      '--connectionString=mongodb+srv://dbAdmin:308NegraAroyoLane@logtracker-cluster.wdxyb7b.mongodb.net/test'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

      // Set up communication
      this.setupMCPServerCommunication();

      // Initialize the connection
      await this.initialize();
      
      // List available tools
      await this.listTools();
      
      this.isConnected = true;
      this.emit('connected', { type: 'manual', tools: this.tools.map(t => t.name) });
      
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      throw error;
    }
  }

  /**
   * Initialize the MCP connection
   */
  private async initialize(): Promise<void> {
    const initMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'log-tracker-mcp-client',
          version: '1.0.0'
        }
      }
    };

    try {
      console.log('Sending initialize message to MCP server...');
      const response = await this.sendMessage(initMessage);
      
      if (response.error) {
        throw new Error(`MCP initialization failed: ${response.error.message || response.error}`);
      }
      
      console.log('MCP server initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MCP connection:', error);
      throw error;
    }
  }

  /**
   * List available tools from the MCP server
   */
  private async listTools(): Promise<void> {
    const listToolsMessage = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };

    try {
      console.log('Requesting available tools from MCP server...');
      const response = await this.sendMessage(listToolsMessage);
      
      if (response.error) {
        throw new Error(`Failed to list tools: ${response.error.message || response.error}`);
      }
      
      if (response.result?.tools) {
        this.tools = response.result.tools.map((tool: any) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }));
        
        console.log('Available MCP tools:', this.tools.map(t => t.name));
      } else {
        console.warn('No tools available from MCP server');
        this.tools = [];
      }
    } catch (error) {
      console.error('Failed to list MCP tools:', error);
      this.tools = [];
      throw error;
    }
  }

  /**
   * Send a message to the MCP server
   */
  private async sendMessage(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('📤 Attempting to send message to MCP server...');
      console.log('📤 Message:', JSON.stringify(message));
      
      if (!this.mcpProcess?.stdin) {
        console.error('❌ MCP process not available');
        reject(new Error('MCP process not available'));
        return;
      }

      const messageStr = JSON.stringify(message) + '\n';
      console.log('📤 Writing message to stdin:', messageStr);
      
      try {
        this.mcpProcess!.stdin.write(messageStr);
        console.log('📤 Message written to stdin successfully');
      } catch (error) {
        console.error('❌ Failed to write message to stdin:', error);
        reject(error);
        return;
      }

      // Store the promise resolver to handle the response
      this.messageQueue.push({ id: message.id, resolve, reject });
      console.log('📤 Message queued, waiting for response...');
      
      // Add timeout to prevent hanging
      setTimeout(() => {
        const pendingMessage = this.messageQueue.find(m => m.id === message.id);
        if (pendingMessage) {
          console.warn('⏰ MCP server response timeout for message', message.id);
          this.messageQueue = this.messageQueue.filter(m => m.id !== message.id);
          reject(new Error(`MCP server response timeout for message ${message.id}`));
        }
      }, 10000); // 10 second timeout
    });
  }

  /**
   * Handle output from the MCP server
   */
  private handleServerOutput(data: string): void {
    console.log('📥 Received data from MCP server:', data);
    this.responseBuffer += data;
    console.log('📥 Current response buffer length:', this.responseBuffer.length);
    
    // Try to parse complete JSON messages
    const lines = this.responseBuffer.split('\n');
    this.responseBuffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          console.log('📥 Parsed JSON message:', message);
          this.handleServerMessage(message);
        } catch (error) {
          console.error('❌ Failed to parse MCP server message:', error);
          console.error('❌ Raw line:', line);
        }
      }
    }
  }

  /**
   * Handle incoming messages from the MCP server
   */
  private handleServerMessage(message: any): void {
    console.log('📥 Received MCP server message:', message);
    
    if (message.id && this.messageQueue.length > 0) {
      const pendingMessage = this.messageQueue.find(m => m.id === message.id);
      if (pendingMessage) {
        this.messageQueue = this.messageQueue.filter(m => m.id !== message.id);
        pendingMessage.resolve(message);
      }
    }
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(toolName: string, arguments_: any, userContext?: UserContext): Promise<any> {
    try {
      // Apply access control if user context is provided
      let finalArguments = arguments_;
      if (userContext) {
        finalArguments = await this.applyAccessControl(userContext, toolName, arguments_);
        console.log(`Applied access control for user ${userContext.userEmail} (Admin: ${userContext.isAdmin})`);
      }

      // Add automatic fields for insert operations
      if (toolName === 'insert-many' && finalArguments.documents) {
        const now = new Date();
        finalArguments.documents = finalArguments.documents.map((doc: any) => ({
          ...doc,
          createdAt: { $date: now.toISOString() }, // MongoDB Date format
          updatedAt: { $date: now.toISOString() }, // MongoDB Date format
          __v: 0
        }));
        console.log(`Added automatic fields (createdAt, updatedAt, __v) to ${finalArguments.documents.length} documents`);
      }

      // Add automatic updatedAt field for update operations
      if (toolName === 'update-many' && finalArguments.update) {
        const now = new Date();
        // If update uses $set, add updatedAt to it
        if (finalArguments.update.$set) {
          finalArguments.update.$set.updatedAt = { $date: now.toISOString() }; // MongoDB Date format
        } else {
          // If no $set, create one with updatedAt
          finalArguments.update = {
            ...finalArguments.update,
            $set: { updatedAt: { $date: now.toISOString() } } // MongoDB Date format
          };
        }
        console.log(`Added automatic updatedAt field to update operation`);
      }

      const callToolMessage = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: finalArguments // Send as object, not string
        }
      };

      console.log(`Calling MCP tool: ${toolName} with arguments:`, finalArguments);
      
      const response = await this.sendMessage(callToolMessage);
      
      if (!response || !response.result) {
        console.warn(`MCP tool ${toolName} returned null or empty result`);
        return { error: 'Tool returned null result', success: false };
      }
      
      console.log(`MCP tool ${toolName} executed successfully`);
      return response.result;
      
    } catch (error: any) {
      console.error(`Error calling MCP tool ${toolName}:`, error);
      return { error: error.message || 'Unknown error', success: false };
    }
  }

  /**
   * Process a query using Gemini AI (simplified version without function calling for now)
   */
  async processQueryWithGemini(
    query: string,
    conversationHistory: MCPMessage[] = [],
    authToken?: string,
    userId?: string,
    model: 'gemini-2.0-flash' | 'gemini-2.5-flash' | 'gemini-2.5-pro' = 'gemini-2.5-flash'
  ): Promise<{
    response: string;
    toolCalls: any[];
    tokensUsed: number;
  }> {
    try {
      // Get user context for access control
      const userContext = userId ? await this.getUserContext(userId) : null;
      
      // Prepare system prompt
      const systemPrompt = `You are an intelligent AI assistant for a comprehensive log tracking application. You provide personalized, context-aware assistance based on user roles and permissions.

${userContext ? `
🎯 CURRENT USER CONTEXT:
👤 User Information:
- Name: ${userContext.userName}
- Email: ${userContext.userEmail}
- User ID: ${userContext.userId}
- Role: ${userContext.isAdmin ? '🔴 ADMIN' : '🔵 USER'}

📊 User Access Summary:
- User Groups: ${userContext.userGroups.length} groups
- Assigned Applications: ${userContext.assignedApplications.length} applications
- Pinned Applications: ${userContext.pinnedApplications.length} applications

🔍 Detailed User Groups:
${userContext.userGroupDetails.map(group => `  • ${group.name} (${group.is_admin ? 'Admin Group' : 'User Group'}) - ${group.assigned_applications.length} assigned apps`).join('\n')}

${!userContext.isAdmin ? `
📱 PRE-FETCHED APPLICATION DATA:
Your Assigned Applications:
${userContext.assignedApplicationDetails.map(app => `  • ${app.name} (${app.environment}) - ${app.hostname} - ${app.isActive ? 'Active' : 'Inactive'} - ${app.description}`).join('\n')}

Your Pinned Applications:
${userContext.pinnedApplicationDetails.map(app => `  • ${app.name} (${app.environment}) - ${app.hostname} - ${app.isActive ? 'Active' : 'Inactive'} - ${app.description}`).join('\n')}
` : ''}

⚙️ User Settings:
- Auto Refresh: ${userContext.settings.autoRefresh ? 'Enabled' : 'Disabled'}
- Auto Refresh Time: ${userContext.settings.autoRefreshTime} seconds
- Logs Per Page: ${userContext.settings.logsPerPage}

${userContext.isAdmin ? `
🔴 ADMIN ACCESS PRIVILEGES:
✅ FULL SYSTEM ACCESS - You have complete administrative control over the entire system
✅ Can access ALL users, ALL applications, ALL user groups, ALL logs, ALL settings
✅ Can perform system-wide operations and administrative tasks
` : `
🔵 USER ACCESS PRIVILEGES:
🔒 HIGHLY RESTRICTED ACCESS - You can only access data related to your assigned applications and user groups
✅ Can access your own user data (pinned apps, settings)
✅ All your application and user group data is pre-fetched and available in context above
`}

${userContext.isAdmin ? `
🎯 ADMIN-SPECIFIC GUIDANCE:
- You can answer questions about ANY user, application, or system-wide data
- You can perform administrative tasks and system maintenance
- You can analyze system-wide trends and patterns
- You can help with user management and access control
` : `
🎯 USER-SPECIFIC GUIDANCE:
- When users say "my" or "mine", use the pre-fetched data from context above
- "My user groups" = use pre-fetched userGroupDetails from context
- "My applications" = use pre-fetched assignedApplicationDetails from context
- "My pinned apps" = use pre-fetched pinnedApplicationDetails from context
- Provide helpful information based on the user's context and permissions
`}
` : '⚠️ NO USER CONTEXT: Access control cannot be determined. Proceed with caution and ask for clarification if needed.'}

⚠️ IMPORTANT RULES:
1. NEVER ask for user ID - automatically use the authenticated user's context
2. ALWAYS apply appropriate access controls based on user role
3. When users say "my" or "mine", automatically use their personal data from context
4. Provide clear, helpful explanations for all information
5. Suggest relevant follow-up queries when appropriate
6. Focus on user-friendly information and avoid technical jargon

${userContext && !userContext.isAdmin ? `
🔒 SECURITY REMINDER: You are operating with USER permissions. You can only access data related to your assigned applications and user groups. If you need broader access, contact an administrator.` : ''}`;

      // Prepare conversation history for Gemini
      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'I understand. I am ready to help you with your log tracking application queries.' }] }
      ];

      // Add conversation history
      conversationHistory.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });

      // Add current query
      contents.push({
        role: 'user',
        parts: [{ text: query }]
      });

      // Get the Gemini model
      const geminiModel = this.gemini.getGenerativeModel({ model });

      // Generate content with Gemini
      const result = await geminiModel.generateContent({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      });

      const response = result.response;
      const text = response.text();

      return {
        response: text,
        toolCalls: [],
        tokensUsed: 0 // Gemini doesn't provide token usage in the same way
      };

    } catch (error) {
      console.error('Error processing query with Gemini:', error);
      throw error;
    }
  }

  /**
   * Process a query using the specified AI model
   */
  async processQuery(
    query: string,
    conversationHistory: MCPMessage[] = [],
    authToken?: string,
    userId?: string,
    model?: AIModel
  ): Promise<{
    response: string;
    toolCalls: any[];
    tokensUsed: number;
  }> {
    const selectedModel = model || this.defaultModel;

    // Route to appropriate AI provider
    if (selectedModel.startsWith('openai-')) {
      return this.processQueryWithOpenAI(query, conversationHistory, authToken, userId, selectedModel as 'openai-gpt-4o-mini' | 'openai-gpt-4o');
    } else if (selectedModel.startsWith('gemini-')) {
      return this.processQueryWithGemini(query, conversationHistory, authToken, userId, selectedModel as 'gemini-2.0-flash' | 'gemini-2.5-flash' | 'gemini-2.5-pro');
    } else {
      throw new Error(`Unsupported model: ${selectedModel}`);
    }
  }

  /**
   * Process a query using OpenAI (renamed from original processQuery)
   */
  async processQueryWithOpenAI(
    query: string,
    conversationHistory: MCPMessage[] = [],
    authToken?: string,
    userId?: string,
    model: 'openai-gpt-4o-mini' | 'openai-gpt-4o' = 'openai-gpt-4o-mini'
  ): Promise<{
    response: string;
    toolCalls: any[];
    tokensUsed: number;
  }> {
    try {
      // Get user context for access control
      const userContext = userId ? await this.getUserContext(userId) : null;
      
      // Prepare messages for OpenAI
      const messages: any[] = [
        {
          role: 'system',
          content: `You are an intelligent AI assistant for a comprehensive log tracking application with direct access to MongoDB databases through MCP (Model Context Protocol) tools. You provide personalized, context-aware assistance based on user roles and permissions.

${userContext ? `
🎯 CURRENT USER CONTEXT:
👤 User Information:
- Name: ${userContext.userName}
- Email: ${userContext.userEmail}
- User ID: ${userContext.userId}
- Role: ${userContext.isAdmin ? '🔴 ADMIN' : '🔵 USER'}

📊 User Access Summary:
- User Groups: ${userContext.userGroups.length} groups
- Assigned Applications: ${userContext.assignedApplications.length} applications
- Pinned Applications: ${userContext.pinnedApplications.length} applications

🔍 Detailed User Groups:
${userContext.userGroupDetails.map(group => `  • ${group.name} (${group.is_admin ? 'Admin Group' : 'User Group'}) - ${group.assigned_applications.length} assigned apps`).join('\n')}

${!userContext.isAdmin ? `
📱 PRE-FETCHED APPLICATION DATA (No Database Access Needed):
Your Assigned Applications:
${userContext.assignedApplicationDetails.map(app => `  • ${app.name} (${app.environment}) - ${app.hostname} - ${app.isActive ? 'Active' : 'Inactive'} - ${app.description}`).join('\n')}

Your Pinned Applications:
${userContext.pinnedApplicationDetails.map(app => `  • ${app.name} (${app.environment}) - ${app.hostname} - ${app.isActive ? 'Active' : 'Inactive'} - ${app.description}`).join('\n')}
` : ''}

⚙️ User Settings:
- Auto Refresh: ${userContext.settings.autoRefresh ? 'Enabled' : 'Disabled'}
- Auto Refresh Time: ${userContext.settings.autoRefreshTime} seconds
- Logs Per Page: ${userContext.settings.logsPerPage}

${userContext.isAdmin ? `
🔴 ADMIN ACCESS PRIVILEGES:
✅ FULL SYSTEM ACCESS - You have complete administrative control over the entire system
✅ All MongoDB tools available (read, write, create, delete, administrative operations)
✅ Can access ALL users, ALL applications, ALL user groups, ALL logs, ALL settings
✅ Can perform system-wide operations and administrative tasks
✅ Can view and modify any data in the system
` : `
🔵 USER ACCESS PRIVILEGES:
🔒 HIGHLY RESTRICTED ACCESS - You can only access LOGS and your own USER data
✅ READ-ONLY MongoDB tools available for LOGS collection only
✅ Can access your own USER collection data (pinned apps, settings)
❌ NO ACCESS to applications, usergroups, or any other collections
❌ NO WRITE ACCESS (insert, update, delete operations are restricted)
❌ NO ADMINISTRATIVE OPERATIONS (create/delete collections, drop databases, etc.)
✅ All your application and user group data is pre-fetched and available in context above
✅ Can query logs for your assigned applications (filtered by application_id)
✅ Can query your own user profile for pinned apps and settings
`}

${userContext.isAdmin ? `
🎯 ADMIN-SPECIFIC GUIDANCE:
- You can answer questions about ANY user, application, or system-wide data
- You can perform administrative tasks and system maintenance
- You can analyze system-wide trends and patterns
- You can help with user management and access control
- You can provide insights across all applications and user groups
` : `
🎯 USER-SPECIFIC GUIDANCE:
- When users say "my" or "mine", use the pre-fetched data from context above
- "My user groups" = use pre-fetched userGroupDetails from context
- "My applications" = use pre-fetched assignedApplicationDetails from context
- "My pinned apps" = use pre-fetched pinnedApplicationDetails from context
- "My logs" = query LOGS collection filtered by user's assigned application IDs
- "My settings" = query USER collection for user's own settings
- ONLY query LOGS collection (filtered by application_id) and USER collection (filtered by _id)
- NEVER query applications or usergroups collections - use pre-fetched data instead
`}
` : '⚠️ NO USER CONTEXT: Access control cannot be determined. Proceed with caution and ask for clarification if needed.'}

🗄️ DATABASE SCHEMA INFORMATION:

DATABASE: "test" (MongoDB Atlas cluster)

⚠️ IMPORTANT SCHEMA NOTES:
- All collections automatically include createdAt, updatedAt, and __v fields
- The MCP client will automatically add these fields to insert and update operations
- Only include the required business fields when creating documents - the system handles timestamps automatically

COLLECTIONS AND SCHEMAS:

1. users Collection:
   - _id: ObjectId
   - email: String (required, unique)
   - name: String (required)
   - pinned_applications: [ObjectId] (references Application)
   - settings: {
     autoRefresh: Boolean (default: false)
     autoRefreshTime: Number (default: 30)
     logsPerPage: Number (default: 25)
   }
   - createdAt: Date (auto-generated timestamp)
   - updatedAt: Date (auto-generated timestamp)
   - __v: Number (version key, auto-generated)

2. usergroups Collection:
   - _id: ObjectId
   - name: String (required, unique)
   - is_admin: Boolean (default: false)
   - is_active: Boolean (default: true)
   - assigned_applications: [ObjectId] (references Application)
   - members: [ObjectId] (references User)
   - createdAt: Date (auto-generated timestamp)
   - updatedAt: Date (auto-generated timestamp)
   - __v: Number (version key, auto-generated)
   - Indexes: { members: 1 }, { assigned_applications: 1 }, { is_active: 1 }

3. applications Collection:
   - _id: ObjectId
   - name: String (required, unique)
   - hostname: String (required)
   - environment: String (required)
   - isActive: Boolean (default: true) ⚠️ NOTE: Field is "isActive", not "status"
   - description: String (required)
   - createdAt: Date (auto-generated timestamp)
   - updatedAt: Date (auto-generated timestamp)
   - __v: Number (version key, auto-generated)

4. logs Collection:
   - _id: ObjectId
   - application_id: ObjectId (references Application)
   - log_level: String (error, warn, info, debug)
   - message: String
   - timestamp: Date
   - createdAt: Date (auto-generated timestamp)
   - updatedAt: Date (auto-generated timestamp)
   - __v: Number (version key, auto-generated)

5. atriskrules Collection:
   - _id: ObjectId
   - log_type: String
   - operator: String
   - unit: String
   - time: Number
   - count: Number
   - createdAt: Date (auto-generated timestamp)
   - updatedAt: Date (auto-generated timestamp)
   - __v: Number (version key, auto-generated)

🛠️ AVAILABLE MONGODB TOOLS:
${this.tools.map(tool => {
  const isReadOnly = ['find', 'count', 'aggregate', 'list-databases', 'list-collections', 'collection-schema', 'collection-indexes', 'collection-storage-size', 'db-stats', 'explain', 'mongodb-logs'].includes(tool.name);
  const isAdminOnly = ['create-collection', 'insert-many', 'update-many', 'delete-many', 'create-index', 'rename-collection', 'drop-collection', 'drop-database'].includes(tool.name);
  
  if (userContext?.isAdmin) {
    return `✅ ${tool.name}: ${tool.description}`;
  } else if (isReadOnly && (tool.name === 'find' || tool.name === 'count' || tool.name === 'aggregate')) {
    return `✅ ${tool.name}: ${tool.description} (LOGS & USER COLLECTIONS ONLY)`;
  } else if (isAdminOnly) {
    return `❌ ${tool.name}: ${tool.description} (ADMIN ONLY)`;
  } else {
    return `❌ ${tool.name}: ${tool.description} (ADMIN ONLY)`;
  }
}).join('\n')}

⚠️ IMPORTANT RULES:
1. NEVER ask for user ID - automatically use the authenticated user's context
2. ALWAYS apply appropriate access controls based on user role
3. For non-admin users, ONLY use read-only operations
4. When users say "my" or "mine", automatically filter to their personal data
5. Provide clear, helpful explanations for all data retrieved
6. Suggest relevant follow-up queries when appropriate
7. If access is denied, explain why and suggest alternatives
8. ⚠️ CRITICAL: Use exact field names from schema:
   - Application status field is "isActive" (boolean), NOT "status"
   - User groups have "members" array (not "userId")
   - Applications have "isActive" field (not "status")
   - Logs have "log_level" field (not "level")
9. ✅ AUTOMATIC FIELD HANDLING: The system automatically adds required fields:
   - createdAt, updatedAt, and __v fields are added automatically to all insert operations
   - Only include the required business fields: name, hostname, environment, isActive, description for applications
10. 🚀 QUERY EFFICIENCY: Always use the most efficient approach:
    - Use $in operator for multiple IDs instead of individual queries
    - Minimize the number of database calls
    - Use pre-fetched context data when available
    - Avoid unnecessary follow-up queries

${userContext && !userContext.isAdmin ? `
🔒 SECURITY REMINDER: You are operating with USER permissions. You can only access data related to your assigned applications and user groups. If you need broader access, contact an administrator.` : ''}`
        },
        ...conversationHistory,
        { role: 'user', content: query }
      ];

      // Convert MCP tools to OpenAI function format
      const tools = this.tools.map(tool => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema
        }
      }));

      // Map model names to OpenAI model names
      const openaiModelMap: Record<string, string> = {
        'openai-gpt-4o-mini': 'gpt-4o-mini',
        'openai-gpt-4o': 'gpt-4o'
      };

      const openaiModel = openaiModelMap[model] || 'gpt-4o-mini';

      // Call OpenAI
      const response = await this.openai.chat.completions.create({
        model: openaiModel,
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1000
      });

      const assistantMessage = response.choices[0].message;
      const toolCalls = assistantMessage.tool_calls || [];
      const tokensUsed = response.usage?.total_tokens || 0;

      if (toolCalls.length > 0) {
        const allToolCalls: any[] = [];
        const allToolResults: MCPToolResult[] = [];
        let currentMessages = [...messages];
        let currentToolCalls = toolCalls;
        let totalTokensUsed = response.usage?.total_tokens || 0;
        let maxIterations = 5; // Prevent infinite loops
        let iteration = 0;

        while (currentToolCalls.length > 0 && iteration < maxIterations) {
          iteration++;
          console.log(`Tool call iteration ${iteration}: ${currentToolCalls.length} tool calls`);
          
          const toolResults: MCPToolResult[] = [];

          for (const toolCall of currentToolCalls) {
            try {
              // Parse arguments if they come as a string from OpenAI
              let parsedArguments: any = toolCall.function.arguments;
              if (typeof parsedArguments === 'string') {
                try {
                  parsedArguments = JSON.parse(parsedArguments);
                } catch (parseError) {
                  console.error('Failed to parse tool arguments:', parseError);
                  parsedArguments = {};
                }
              }
              
              // Call the MCP tool with user context for access control
              const result = await this.callTool(toolCall.function.name, parsedArguments, userContext ?? undefined);
              
              // Ensure the result is properly stringified
              let content: string;
              if (result === null || result === undefined) {
                content = JSON.stringify({ error: 'Tool returned null result' });
              } else if (typeof result === 'string') {
                content = result;
              } else {
                content = JSON.stringify(result);
              }
              
              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                content: content
              });
            } catch (error: any) {
              console.error(`Error executing MCP tool ${toolCall.function.name}:`, error);
              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                content: JSON.stringify({ error: 'Failed to execute tool', details: error.message || 'Unknown error' })
              });
            }
          }

          // Add current tool calls and results to the overall tracking
          allToolCalls.push(...currentToolCalls);
          allToolResults.push(...toolResults);

          // Update messages for next iteration
          currentMessages = [
            ...currentMessages,
            { role: 'assistant', content: null, tool_calls: currentToolCalls },
            ...toolResults
          ];

          // Check if AI wants to make more tool calls
          const nextResponse = await this.openai.chat.completions.create({
            model: openaiModel,
            messages: currentMessages,
            tools,
            tool_choice: 'auto',
            temperature: 0.7,
            max_tokens: 1000
          });

          const nextAssistantMessage = nextResponse.choices[0].message;
          currentToolCalls = nextAssistantMessage.tool_calls || [];
          totalTokensUsed += nextResponse.usage?.total_tokens || 0;

          // If no more tool calls, we're done
          if (currentToolCalls.length === 0) {
            return {
              response: nextAssistantMessage.content || '',
              toolCalls: allToolCalls.map(call => ({
                name: call.function.name,
                arguments: call.function.arguments,
                result: allToolResults.find(r => r.tool_call_id === call.id)?.content
              })),
              tokensUsed: totalTokensUsed
            };
          }
        }

        // If we hit max iterations, get final response
        const finalResponse = await this.openai.chat.completions.create({
          model: openaiModel,
          messages: currentMessages,
          temperature: 0.7,
          max_tokens: 1000
        });

        return {
          response: finalResponse.choices[0].message.content || '',
          toolCalls: allToolCalls.map(call => ({
            name: call.function.name,
            arguments: call.function.arguments,
            result: allToolResults.find(r => r.tool_call_id === call.id)?.content
          })),
          tokensUsed: totalTokensUsed + (finalResponse.usage?.total_tokens || 0)
        };
      }

      return {
        response: assistantMessage.content || '',
        toolCalls: [],
        tokensUsed
      };

    } catch (error) {
      console.error('Error processing query with OpenAI:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
    this.isConnected = false;
    this.tools = [];
    this.messageQueue = [];
    this.responseBuffer = '';
    
    // Also stop the MongoDB MCP server
    await mongoMCPManager.stopMCPServer();
  }

  /**
   * Check if the MCP server is connected
   */
  isServerConnected(): boolean {
    return this.isConnected && this.mcpProcess !== null;
  }

  /**
   * Get available tools
   */
  getAvailableTools(): MCPTool[] {
    return this.tools;
  }

  /**
   * Get MongoDB MCP server status
   */
  getMongoDBStatus(): { connected: boolean; connectionString: string } {
    return mongoMCPManager.getConnectionStatus();
  }

  /**
   * Restart MongoDB MCP server
   */
  async restartMongoDBServer(): Promise<void> {
    await mongoMCPManager.restartMCPServer();
  }
}

// Export a singleton instance
export const mcpClient = new MCPClient(); 