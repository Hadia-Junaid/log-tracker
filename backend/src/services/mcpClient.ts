import OpenAI from 'openai';
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

export class MCPClient extends EventEmitter {
  private openai: OpenAI;
  private mcpProcess: ChildProcess | null = null;
  private tools: MCPTool[] = [];
  private isConnected: boolean = false;
  private messageQueue: any[] = [];
  private responseBuffer: string = '';
  private autoConnectMongo: boolean = true;

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: config.get<string>('openai.apiKey'),
    });
    
    // Auto-connect to MongoDB MCP server if enabled
    if (this.autoConnectMongo) {
      this.autoConnectToMongoDB();
    }
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
   * Process a query using OpenAI and available MCP tools
   */
  async processQuery(
    query: string,
    conversationHistory: MCPMessage[] = [],
    authToken?: string,
    userId?: string
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

🎯 COMPREHENSIVE USE CASES & QUERY PATTERNS:

${userContext ? `
=== 1. LOG ANALYSIS USE CASES ===

BASIC LOG QUERIES:
1. "Show my logs" → 
   find logs where application_id is in user's assigned apps:
   {"database": "test", "collection": "logs", "filter": {"application_id": {"$in": [${userContext.assignedApplications.map(id => `{"$oid": "${id}"}`).join(', ')}]}}}

2. "Show error logs" → 
   find error logs for user's applications:
   {"database": "test", "collection": "logs", "filter": {"application_id": {"$in": [${userContext.assignedApplications.map(id => `{"$oid": "${id}"}`).join(', ')}]}, "log_level": "error"}}

3. "Show recent logs" → 
   find recent logs sorted by timestamp:
   {"database": "test", "collection": "logs", "filter": {"application_id": {"$in": [${userContext.assignedApplications.map(id => `{"$oid": "${id}"}`).join(', ')}]}}, "sort": {"timestamp": -1}, "limit": 50}

ADVANCED LOG ANALYSIS:
4. "Summarize logs across my applications" → 
   Use aggregate to group and count by log_level and application:
   {"database": "test", "collection": "logs", "pipeline": [
     {"$match": {"application_id": {"$in": [${userContext.assignedApplications.map(id => `{"$oid": "${id}"}`).join(', ')}]}}},
     {"$group": {"_id": {"app": "$application_id", "level": "$log_level"}, "count": {"$sum": 1}}},
     {"$sort": {"count": -1}}
   ]}

5. "Diagnose issues by correlating events" → 
   Find logs with error patterns and related warnings:
   {"database": "test", "collection": "logs", "filter": {"application_id": {"$in": [${userContext.assignedApplications.map(id => `{"$oid": "${id}"}`).join(', ')}]}, "log_level": {"$in": ["error", "warn"]}}, "sort": {"timestamp": -1}}

6. "Show logs from specific time period" → 
   Find logs within date range:
   {"database": "test", "collection": "logs", "filter": {"application_id": {"$in": [${userContext.assignedApplications.map(id => `{"$oid": "${id}"}`).join(', ')}]}, "timestamp": {"$gte": "2024-01-01T00:00:00Z", "$lte": "2024-01-31T23:59:59Z"}}}

${userContext.isAdmin ? `
=== 2. NATURAL LANGUAGE APPLICATION & USER GROUP CREATION ===

APPLICATION CREATION PATTERNS:
1. "Create an app named 'InventoryService' with hostname 'localhost'" → 
   insert-many applications:
   {"database": "test", "collection": "applications", "documents": [{
     "name": "InventoryService",
     "hostname": "localhost", 
     "environment": "Development",
     "isActive": true,
     "description": "Inventory management service"
   }]}
   
   ✅ CORRECT EXAMPLE (The system will automatically add createdAt, updatedAt, and __v fields):
   {"database": "test", "collection": "applications", "documents": [{
     "name": "InventoryService",
     "hostname": "localhost", 
     "environment": "Development",
     "isActive": true,
     "description": "Inventory management service"
   }]}

2. "Create app 'StockService' and assign it to group 'Ops'" → 
   Step 1: Create application
   Step 2: Find Ops group and update assigned_applications array

USER GROUP CREATION PATTERNS:
3. "Create a group named 'Backend Team'" → 
   insert-many usergroups:
   {"database": "test", "collection": "usergroups", "documents": [{
     "name": "Backend Team",
     "is_admin": false,
     "is_active": true,
     "assigned_applications": [],
     "members": []
   }]}
   
   ✅ The system will automatically add createdAt, updatedAt, and __v fields

4. "Create admin group 'System Administrators'" → 
   insert-many usergroups:
   {"database": "test", "collection": "usergroups", "documents": [{
     "name": "System Administrators",
     "is_admin": true,
     "is_active": true,
     "assigned_applications": [],
     "members": []
   }]}
   
   ✅ The system will automatically add createdAt, updatedAt, and __v fields

=== 3. NATURAL LANGUAGE EDITING & PERMISSIONS ===

APPLICATION EDITING:
5. "Rename 'InventoryService' to 'StockService'" → 
   update-many applications:
   {"database": "test", "collection": "applications", "filter": {"name": "InventoryService"}, "update": {"$set": {"name": "StockService"}}}

6. "Deactivate 'legacy-app'" → 
   update-many applications:
   {"database": "test", "collection": "applications", "filter": {"name": "legacy-app"}, "update": {"$set": {"isActive": false}}}

USER GROUP MEMBERSHIP:
7. "Add 'backend-team@gosaas.io' to 'Ops' group" → 
   Step 1: Find user by email
   Step 2: Update usergroups members array:
   update-many usergroups:
   {"database": "test", "collection": "usergroups", "filter": {"name": "Ops"}, "update": {"$addToSet": {"members": {"$oid": "USER_ID"}}}}

8. "Remove 'john.doe@company.com' from 'Development' group" → 
   update-many usergroups:
   {"database": "test", "collection": "usergroups", "filter": {"name": "Development"}, "update": {"$pull": {"members": {"$oid": "USER_ID"}}}}

APPLICATION ASSIGNMENTS:
9. "Assign 'StockService' to 'Ops' group" → 
   Step 1: Find application by name
   Step 2: Update usergroups assigned_applications:
   update-many usergroups:
   {"database": "test", "collection": "usergroups", "filter": {"name": "Ops"}, "update": {"$addToSet": {"assigned_applications": {"$oid": "APP_ID"}}}}

10. "Revoke access of 'legacy-app' from all user groups" → 
    update-many usergroups:
    {"database": "test", "collection": "usergroups", "filter": {}, "update": {"$pull": {"assigned_applications": {"$oid": "APP_ID"}}}}

PERSONAL CONTEXT QUERIES:
11. "Show my user groups" → 
    find usergroups where members array contains user ID:
    {"database": "test", "collection": "usergroups", "filter": {"members": {"$oid": "${userContext.userId}"}}}

12. "List my applications" → 
    find applications where _id is in user's assigned apps:
    {"database": "test", "collection": "applications", "filter": {"_id": {"$in": [${userContext.assignedApplications.map(id => `{"$oid": "${id}"}`).join(', ')}]}}}

13. "Show my active applications" → 
    find applications where _id is in assigned apps AND isActive is true:
    {"database": "test", "collection": "applications", "filter": {"_id": {"$in": [${userContext.assignedApplications.map(id => `{"$oid": "${id}"}`).join(', ')}]}, "isActive": true}}

14. "Show my pinned apps" → 
    find applications where _id is in user's pinned apps:
    {"database": "test", "collection": "applications", "filter": {"_id": {"$in": [${userContext.pinnedApplications.map(id => `{"$oid": "${id}"}`).join(', ')}]}}}

15. "Show my user profile" → 
    find user document with user ID:
    {"database": "test", "collection": "users", "filter": {"_id": {"$oid": "${userContext.userId}"}}}

SYSTEM-WIDE ADMIN QUERIES:
16. "Show all users" → {"database": "test", "collection": "users", "filter": {}}
17. "List all applications" → {"database": "test", "collection": "applications", "filter": {}}
18. "System-wide logs" → {"database": "test", "collection": "logs", "filter": {}}
19. "User group statistics" → {"database": "test", "collection": "usergroups", "filter": {}}
20. "Application performance" → {"database": "test", "collection": "applications", "filter": {"isActive": true}}

` : `
USER QUERIES (LOGS & USER COLLECTIONS ONLY):
• "Show my active applications" → Use pre-fetched assignedApplicationDetails from context (filter by isActive: true)
• "Recent logs for my apps" → {"database": "test", "collection": "logs", "filter": {"application_id": {"$in": [${userContext.assignedApplications.map(id => `{"$oid": "${id}"}`).join(', ')}]}}, "sort": {"timestamp": -1}}
• "Error logs from my applications" → {"database": "test", "collection": "logs", "filter": {"application_id": {"$in": [${userContext.assignedApplications.map(id => `{"$oid": "${id}"}`).join(', ')}]}, "log_level": "error"}}
• "My user profile" → {"database": "test", "collection": "users", "filter": {"_id": {"$oid": "${userContext.userId}"}}}
• "My user groups" → Use pre-fetched userGroupDetails from context
• "My pinned apps" → Use pre-fetched pinnedApplicationDetails from context
`}
` : ''}

🔧 MONGODB TOOL USAGE PATTERNS:

1. DATABASE EXPLORATION:
   - Start with "list-databases" to see available databases
   - Use "list-collections" with database name to explore collections
   - Use "collection-schema" to understand data structure

🚀 ADVANCED USE CASES & NATURAL LANGUAGE PROCESSING:

${userContext ? `
=== LOG ANALYSIS CAPABILITIES ===
• "Summarize logs across my applications" - Use aggregate to group by log_level and application
• "Diagnose issues by correlating events" - Find error patterns and related warnings across time
• "Show logs from last 24 hours" - Filter by timestamp range
• "Find all error logs from GoCAR application" - Filter by application and log_level
• "Show warning logs from production environment" - Filter by environment and log_level

${userContext.isAdmin ? `
=== NATURAL LANGUAGE CREATION & EDITING ===

APPLICATION MANAGEMENT:
• "Create an app named 'InventoryService' with hostname 'localhost'" - Use insert-many with proper schema
• "Create app 'StockService' and assign it to group 'Ops'" - Multi-step: create app, then update group
• "Rename 'InventoryService' to 'StockService'" - Use update-many with name filter
• "Deactivate 'legacy-app'" - Set isActive to false
• "Change hostname of 'user-service' to 'api.company.com'" - Update hostname field

USER GROUP MANAGEMENT:
• "Create a group named 'Backend Team'" - Use insert-many with is_admin: false
• "Create admin group 'System Administrators'" - Use insert-many with is_admin: true
• "Add 'backend-team@gosaas.io' to 'Ops' group" - Find user by email, then update members array
• "Remove 'john.doe@company.com' from 'Development' group" - Use $pull to remove from members
• "Assign 'StockService' to 'Ops' group" - Find app by name, then update assigned_applications
• "Revoke access of 'legacy-app' from all user groups" - Use $pull on all groups

PERMISSION MANAGEMENT:
• "Give admin access to 'alice@company.com'" - Find user, then add to admin group
• "Remove admin privileges from 'bob@company.com'" - Remove from admin groups
• "Assign all production apps to 'Ops' group" - Find production apps, then update group
• "Create read-only access for 'viewers' group" - Create group with limited permissions

MULTI-STEP OPERATIONS:
• "Set up a new development environment with apps A, B, C" - Create apps, create group, assign apps
• "Migrate user 'john' from 'Dev' to 'Ops' group" - Remove from Dev, add to Ops
• "Archive old applications and create new ones" - Deactivate old apps, create new ones
` : `
USER QUERIES (Read-only access):
• "Show my application logs" - Filter by user's assigned applications
• "Find errors in my apps" - Filter by log_level: "error" and user's apps
• "Show recent activity" - Sort by timestamp for user's applications
• "Summarize my app performance" - Aggregate logs for user's applications
`}
` : ''}

2. DATA QUERYING:
   - Use "find" for document retrieval with filters, projections, and sorting
   - Use "count" for document counting with optional filters
   - Use "aggregate" for complex data analysis and grouping

3. CORRECT FILTERING EXAMPLES:
   - User-specific: {"_id": {"$oid": "${userContext?.userId || 'user_id'}"}}
   - Application-specific: {"_id": {"$in": [${userContext?.assignedApplications.map(id => `{"$oid": "${id}"}`).join(', ') || '{"$oid": "app_id"}'}]}}
   - Active applications: {"isActive": true} ⚠️ NOTE: Field is "isActive", not "status"
   - User groups by member: {"members": {"$oid": "${userContext?.userId || 'user_id'}"}}
   - Time-based: {"timestamp": {"$gte": "2024-01-01", "$lte": "2024-12-31"}}
   - Log level: {"log_level": {"$in": ["error", "warn"]}}

4. AGGREGATION PATTERNS:
   - Group by application: [{"$group": {"_id": "$application_id", "count": {"$sum": 1}}}]
   - Time-based grouping: [{"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}}, "count": {"$sum": 1}}}]
   - Error rate calculation: [{"$group": {"_id": "$application_id", "total": {"$sum": 1}, "errors": {"$sum": {"$cond": [{"$eq": ["$log_level", "error"]}, 1, 0]}}}}]

${userContext ? `
🎯 PERSONALIZED RESPONSES:
- Always address the user by name: ${userContext.userName}
- Provide context-aware explanations based on their role and access level
- Suggest relevant follow-up queries based on their assigned applications and groups
- When showing data, explain how it relates to their specific context
- If no data is found, explain why and suggest alternatives

📋 RESPONSE FORMATTING GUIDELINES:

1. **User Groups Queries** ("my user groups", "groups I'm in"):
   - Show only: Group names and admin status
   - Format: Simple comma-separated list
   - Example: "You are a member of: Admin Group (Admin), Development Team"
   - NO bullet points, NO markdown, NO technical details
   - Store full details in context for follow-up questions

2. **Applications Queries** ("my apps", "active apps", "my applications"):
   - Show only: Application names and environments
   - Format: Simple comma-separated list
   - Example: "Your active applications: GoCAR (Development), GoCAD (Development), user-service (Production)"
   - NO bullet points, NO markdown, NO technical details
   - Store full details in context for follow-up questions

3. **Logs Queries** ("my logs", "recent logs"):
   - Show only: Log count, recent activity summary
   - Format: Summary with key metrics
   - Example: "Found 1,247 logs in the last 24 hours across your applications"
   - Store detailed logs in context for follow-up questions

4. **General Data Display**:
   - NEVER show ObjectIDs, internal IDs, or technical metadata
   - Focus on user-friendly information (names, descriptions, status)
   - Use clean formatting without markdown symbols (** **)
   - Provide concise, readable summaries
   - NO numbered lists, NO bullet points, NO bold formatting
   - Use simple comma-separated lists or natural language
   - NO "Created At", "Updated At", "Active Status" or other technical fields

5. **Follow-up Context**:
   - When user asks for "details" or "more info", provide full data from context
   - Keep detailed information available for 2-3 follow-up prompts
   - Offer to show specific details when relevant

${userContext.isAdmin ? `
🔴 ADMIN RESPONSE STYLE:
- Provide comprehensive system-wide insights
- Include administrative recommendations when appropriate
- Highlight potential issues or areas needing attention
- Offer system optimization suggestions
` : `
🔵 USER RESPONSE STYLE:
- Focus on personal and relevant information
- Explain how data relates to their specific applications and groups
- Provide actionable insights for their assigned resources
- Suggest ways to optimize their workflow
`}
` : ''}

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

🎨 RESPONSE FORMATTING EXAMPLES:

**User Groups Response:**
❌ BAD: "1. **Admin Group** (Admin) - **Active Status:** Yes - **Assigned Applications:** - GoCAR - GoCAD - **Created At:** July 2, 2025"
✅ GOOD: "You are a member of: Admin Group (Admin), Development Team"

**Group Members Response:**
❌ BAD: "The members of the 'admin group' are: 1. User ID: 68650fd57a72d0b64525da71 2. User ID: 686537574ddafa6df2987e26"
✅ GOOD: "The members of the Admin Group are: John Doe, Jane Smith, Bob Johnson, Alice Brown, Mike Wilson, You (Bilal Salman)"

**Applications Response:**
❌ BAD: "1. **GoCAR** - **Hostname:** localhost - **Environment:** Development - **Description:** This is a placeholder..."
✅ GOOD: "Your active applications: GoCAR (Development), GoCAD (Development), user-service (Production)"

**Logs Response:**
❌ BAD: "Found 1,247 documents in the collection 'logs': [{"_id": {"$oid": "..."}, "application_id": {"$oid": "..."}]"
✅ GOOD: "Found 1,247 logs in the last 24 hours across your applications. Recent activity shows 89 errors and 1,158 info messages."

**Follow-up Response:**
When user asks "give me details" or "show me more info", then provide full data with proper formatting.

🚫 STRICT FORMATTING RULES:
- NEVER use numbered lists (1., 2., 3.)
- NEVER use bullet points (-, •, *)
- NEVER use bold formatting (**text**)
- NEVER show technical fields (Created At, Updated At, Active Status, IDs)
- NEVER show User IDs - ALWAYS fetch and display user names instead
- ALWAYS use simple comma-separated lists
- ALWAYS focus on user-friendly information only

👥 USER NAME RESOLUTION:
When displaying user information (members, users, etc.):
1. If you see User IDs in results, ALWAYS make a follow-up query to get user names
2. Use find query: {"database": "test", "collection": "users", "filter": {"_id": {"$oid": "USER_ID"}}}
3. Extract the "name" field from the user document
4. Display only the user names, never the IDs
5. Example: Instead of "User ID: 68650fd57a72d0b64525da71", show "John Doe"

🔧 MULTI-STEP OPERATION HANDLING:
For complex operations involving multiple collections:
1. ALWAYS break down into sequential steps
2. Use find queries to locate existing records by name/email
3. Use insert-many for creation operations
4. Use update-many for modification operations
5. Confirm each step before proceeding to the next
6. Provide clear feedback on what was accomplished

📝 CREATION & EDITING BEST PRACTICES:
• When creating applications: Always include name, hostname, environment, isActive, description
  ✅ The system will automatically add createdAt, updatedAt, and __v fields
• When creating user groups: Always include name, is_admin, is_active, empty arrays for members/assigned_applications
  ✅ The system will automatically add createdAt, updatedAt, and __v fields
• When adding users to groups: First find user by email, then update group's members array
• When assigning apps to groups: First find app by name, then update group's assigned_applications array
• When editing: Use exact field names from schema (isActive, not status; members, not userId)

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

      // Call OpenAI
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
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
        const toolResults: MCPToolResult[] = [];

        for (const toolCall of toolCalls) {
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

        // Get the final response with tool results
        const finalResponse = await this.openai.chat.completions.create({
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
          response: finalResponse.choices[0].message.content || '',
          toolCalls: toolCalls.map(call => ({
            name: call.function.name,
            arguments: call.function.arguments,
            result: toolResults.find(r => r.tool_call_id === call.id)?.content
          })),
          tokensUsed: (response.usage?.total_tokens || 0) + (finalResponse.usage?.total_tokens || 0)
        };
      }

      return {
        response: assistantMessage.content || '',
        toolCalls: [],
        tokensUsed
      };

    } catch (error) {
      console.error('Error processing query with MCP client:', error);
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