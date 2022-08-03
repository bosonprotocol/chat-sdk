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
  content: StringContent | ImageContent | ProposalContent;
}

export enum MessageType {
  String = "STRING",
  Image = "IMAGE",
  Proposal = "PROPOSAL"
}

export interface StringContent {
  value: string;
}

export interface ImageContent {
  value: {
    fileName: string;
    fileType: SupportedImageMimeTypes;
    fileSize: number;
    encodedContent: string;
  };
}

export enum SupportedImageMimeTypes {
  PNG = "image/png",
  JPEG = "image/jpeg",
  GIF = "image/gif"
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
