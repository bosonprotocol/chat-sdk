import { z } from "zod";

export const supportedXmtpEnvs = ["dev", "production", "local"] as const;
export const xmtpEnvSchema = z.enum(supportedXmtpEnvs);
