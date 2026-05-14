import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const roleEnum = pgEnum('role', ['customer', 'admin', 'operator'])

export const languageEnum = pgEnum('language', ['en', 'fr', 'es', 'de'])

export const orderStatusEnum = pgEnum('order_status', [
  'documents_pending',
  'documents_under_review',
  'documents_approved',
  'submitted',
  'delivered',
])

export const tierEnum = pgEnum('tier', ['essential', 'standard', 'express'])

export const documentTypeEnum = pgEnum('document_type', [
  'passport',
  'proof_of_address',
  'signed_poa',
])

export const aiReviewStatusEnum = pgEnum('ai_review_status', [
  'pending',
  'clear',
  'flagged',
  'error',
  'manual_review',
])

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'succeeded',
  'failed',
  'refunded',
])

export const notificationTypeEnum = pgEnum('notification_type', ['email', 'sms'])

export const notificationStatusEnum = pgEnum('notification_status', [
  'pending',
  'sent',
  'failed',
])

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    role: roleEnum('role').notNull().default('customer'),
    language: languageEnum('language').notNull().default('en'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_users_email').on(t.email),
    index('idx_users_role').on(t.role),
  ],
)

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tier: tierEnum('tier').notNull(),
    status: orderStatusEnum('status').notNull().default('documents_pending'),

    // Customer details — collected after payment, before document upload
    fullName: text('full_name'),
    dateOfBirth: date('date_of_birth'),
    nationality: text('nationality'),
    passportNumber: text('passport_number'),
    passportExpiry: date('passport_expiry'),
    address: text('address'),

    // NIF delivery — immutable once set
    nifNumber: text('nif_number'),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    documentsSubmittedAt: timestamp('documents_submitted_at'),
    documentsApprovedAt: timestamp('documents_approved_at'),
    submittedToFinancasAt: timestamp('submitted_to_financas_at'),
    deliveredAt: timestamp('delivered_at'),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),

    // Fiscal representation (Standard and Express only)
    fiscalRepExpiresAt: timestamp('fiscal_rep_expires_at'),
    // Set when customer confirms "I no longer need fiscal rep" — suppresses all future renewal emails
    fiscalRepDismissedAt: timestamp('fiscal_rep_dismissed_at'),

    // Generated POA — Supabase Storage path; null until the user generates the document
    poaGeneratedPath: text('poa_generated_path'),

    // Stripe
    stripeCheckoutSessionId: text('stripe_checkout_session_id'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
  },
  (t) => [
    index('idx_orders_user_id').on(t.userId),
    index('idx_orders_status').on(t.status),
    index('idx_orders_tier').on(t.tier),
    index('idx_orders_created_at').on(t.createdAt.desc()),
    // Partial index for Express SLA queries — only rows waiting for operator submission
    index('idx_orders_documents_approved_at')
      .on(t.documentsApprovedAt)
      .where(sql`${t.status} = 'documents_approved'`),
  ],
)

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: documentTypeEnum('type').notNull(),

    // File storage
    filePath: text('file_path').notNull(),
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size').notNull(),
    mimeType: text('mime_type').notNull(),

    // AI review (passport and proof_of_address only — signed_poa is accepted immediately)
    aiReviewStatus: aiReviewStatusEnum('ai_review_status'),
    aiReviewReason: text('ai_review_reason'),
    aiReviewedAt: timestamp('ai_reviewed_at'),
    aiReviewAttempts: integer('ai_review_attempts').notNull().default(0),

    // Admin override
    adminOverride: boolean('admin_override').notNull().default(false),
    adminOverrideBy: uuid('admin_override_by').references(() => users.id, { onDelete: 'set null' }),
    adminOverrideReason: text('admin_override_reason'),
    adminOverrideAt: timestamp('admin_override_at'),

    // Final status
    approved: boolean('approved').notNull().default(false),
    approvedAt: timestamp('approved_at'),

    // Soft-delete — set when user re-uploads this document type; old record kept for audit
    supersededAt: timestamp('superseded_at'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_documents_order_id').on(t.orderId),
    index('idx_documents_user_id').on(t.userId),
    index('idx_documents_type').on(t.type),
    index('idx_documents_ai_review_status').on(t.aiReviewStatus),
  ],
)

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Stripe data
    stripePaymentIntentId: text('stripe_payment_intent_id').notNull().unique(),
    stripeCheckoutSessionId: text('stripe_checkout_session_id').unique(),

    // Payment details
    amount: integer('amount').notNull(), // cents
    currency: text('currency').notNull().default('eur'),
    status: paymentStatusEnum('status').notNull().default('pending'),

    // Metadata
    tier: tierEnum('tier').notNull(),
    isRenewal: boolean('is_renewal').notNull().default(false),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_payments_order_id').on(t.orderId),
    index('idx_payments_user_id').on(t.userId),
    uniqueIndex('idx_payments_stripe_payment_intent_id').on(t.stripePaymentIntentId),
    uniqueIndex('idx_payments_stripe_checkout_session_id').on(t.stripeCheckoutSessionId),
  ],
)

export const operatorNotifications = pgTable(
  'operator_notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    operatorId: uuid('operator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    status: notificationStatusEnum('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    lastAttemptAt: timestamp('last_attempt_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    sentAt: timestamp('sent_at'),
  },
  (t) => [
    index('idx_operator_notifications_order_id').on(t.orderId),
    index('idx_operator_notifications_status').on(t.status),
  ],
)

export const operatorPreferences = pgTable('operator_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  emailNotifications: boolean('email_notifications').notNull().default(true),
  smsNotifications: boolean('sms_notifications').notNull().default(true),
  phoneNumber: text('phone_number'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Append-only audit log — no updatedAt, records are never modified
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    details: jsonb('details').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_audit_log_user_id').on(t.userId),
    index('idx_audit_log_order_id').on(t.orderId),
    index('idx_audit_log_action').on(t.action),
    index('idx_audit_log_created_at').on(t.createdAt.desc()),
  ],
)

// ---------------------------------------------------------------------------
// Inferred types — use these everywhere instead of writing duplicate interfaces
// ---------------------------------------------------------------------------

export type SelectUser = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert

export type SelectOrder = typeof orders.$inferSelect
export type InsertOrder = typeof orders.$inferInsert

export type SelectDocument = typeof documents.$inferSelect
export type InsertDocument = typeof documents.$inferInsert

export type SelectPayment = typeof payments.$inferSelect
export type InsertPayment = typeof payments.$inferInsert

export type SelectOperatorNotification = typeof operatorNotifications.$inferSelect
export type InsertOperatorNotification = typeof operatorNotifications.$inferInsert

export type SelectOperatorPreferences = typeof operatorPreferences.$inferSelect
export type InsertOperatorPreferences = typeof operatorPreferences.$inferInsert

export type SelectAuditLog = typeof auditLog.$inferSelect
export type InsertAuditLog = typeof auditLog.$inferInsert
