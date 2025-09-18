/**
 * Standard return type for MCP (Model Context Protocol) server functions.
 * Ensures consistent structured responses across the entire codebase.
 */
export type ReturnTypeMcp = {
  content: [
    {
      type: "text";
      text: string;
    },
  ];
};

export type ReturnTypeMcpResource = {
  content: [
    {
      type: "resource";
      resource: {
        uri: string;
        mimetype: string;
        text: string;
      };
    },
  ];
};
