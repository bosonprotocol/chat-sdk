export interface ThreadObject {
  threadId: ThreadId;
  counterparty: string;
  messages: MessageData[];
}

export interface ThreadId {
  exchangeId: string;
  buyerId: string;
  sellerId: string;
}

export interface MessageData {
  authorityId: string;
  timestamp: number;
  sender: string;
  recipient: string;
  data: MessageObject;
}

export interface MessageObject {
  threadId: ThreadId;
  contentType: MessageType;
  version: string;
  content: StringContent | FileContent | ProposalContent;
}

export enum MessageType {
  String = "STRING",
  File = "FILE",
  Proposal = "PROPOSAL"
}

export interface StringContent {
  value: string;
}

export interface FileContent {
  value: {
    fileName: string;
    fileType: SupportedFileMimeTypes;
    fileSize: number;
    encodedContent: string;
  };
}

export enum SupportedFileMimeTypes {
  PNG = "image/png",
  JPEG = "image/jpeg",
  GIF = "image/gif",
  PDF = "application/pdf"
}

export interface ProposalContent {
  value: {
    title: string;
    description: string;
    disputeContext: string[];
    proposals: ProposalItem[];
  };
}

export interface ProposalItem {
  type: string;
  percentageAmount: string;
  signature: string;
}
