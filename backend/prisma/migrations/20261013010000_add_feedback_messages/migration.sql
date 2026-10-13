-- Messages people send from "Talk to me" (app and website).
CREATE TABLE "feedback_messages" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "replyTo" TEXT,
    "country" TEXT,
    "platform" TEXT,
    "handledAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feedback_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "feedback_messages_createdAt_idx" ON "feedback_messages"("createdAt");
