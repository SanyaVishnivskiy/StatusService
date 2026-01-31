export interface MongoDbConfig {
  url: string;
}

export interface ServerConfig {
  serviceName: string;
  version: string;
}

export interface GroupsConfig {
  defaultGroupName: string;
  defaultGroupJoinKey: string;
}

export interface AppConfig {
  mongoDb: MongoDbConfig;
  server: ServerConfig;
}

export default () => ({
  server: {
    serviceName: 'Status API',
    version: '1.0.0',
  },
  mongoDb:{
    url: process.env.MONGODB_URL,
  },
  groups: {
    defaultGroupName: process.env.DEFAULT_GROUP_NAME,
    defaultGroupJoinKey: process.env.DEFAULT_GROUP_JOIN_KEY,
  },
} as AppConfig);
