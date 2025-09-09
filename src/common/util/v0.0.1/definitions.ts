export const version = "0.0.1";
export const domain = "bosonprotocol.io";

export enum SupportedFileMimeTypes {
  PNG = "image/png",
  JPEG = "image/jpeg",
  GIF = "image/gif",
  PDF = "application/pdf",
}

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
  timestamp: bigint;
  sender: string;
  recipient: string;
  data: MessageObject;
}

export interface MessageObject {
  threadId: ThreadId;
  contentType: MessageType;
  version: typeof version;
  content:
    | StringContent
    | FileContent
    | ProposalContent
    | StringIconContent
    | AcceptProposalContent
    | EscalateDisputeContent;
}

export type JSONString<T> = `${string}` & { __jsonType: T };

export enum MessageType {
  String = "STRING",
  File = "FILE",
  Proposal = "PROPOSAL",
  CounterProposal = "COUNTER_PROPOSAL",
  AcceptProposal = "ACCEPT_PROPOSAL",
  StringIcon = "STRING_ICON",
  EscalateDispute = "ESCALATE_DISPUTE",
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

export interface StringIconContent {
  value: {
    icon: string;
    heading: string;
    body: string;
    type: string;
  };
}

export interface AcceptProposalContent {
  value: {
    title: string;
    proposal: ProposalItem;
    icon: string;
    heading: string;
    body: string;
  };
}

export interface EscalateDisputeContent {
  value: {
    title: string;
    description: string;
    disputeResolverInfo: { label: string; value: string }[];
    icon: string;
    heading: string;
    body: string;
  };
}
