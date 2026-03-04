/**
 * Models for Knowledge Base management operations against ServiceNow tables:
 * kb_knowledge_base, kb_category, and kb_knowledge.
 */

// ============================================================
// Record Types
// ============================================================

/**
 * A knowledge base record from the kb_knowledge_base table.
 */
export interface KnowledgeBaseRecord {
    sys_id: string;
    title: string;
    description?: string;
    owner?: string;
    active?: string;
    kb_version?: string;
    application?: string;
    kb_managers?: string;
    sys_created_on?: string;
    sys_updated_on?: string;
    sys_created_by?: string;
    sys_updated_by?: string;
    [key: string]: unknown;
}

/**
 * A knowledge category record from the kb_category table.
 * Note: kb_category uses "label" (not "title") and "value" for the KB reference.
 */
export interface KnowledgeCategoryRecord {
    sys_id: string;
    /** Category display name */
    label: string;
    /** Knowledge base sys_id reference */
    value: string;
    /** Parent category sys_id */
    parent_id?: string;
    /** Full category path */
    full_category?: string;
    active?: string;
    sys_created_on?: string;
    sys_updated_on?: string;
    sys_created_by?: string;
    sys_updated_by?: string;
    [key: string]: unknown;
}

/**
 * A full knowledge article record from the kb_knowledge table,
 * including body content fields (text, wiki).
 */
export interface KnowledgeArticleRecord {
    sys_id: string;
    number?: string;
    short_description: string;
    /** Article body in HTML */
    text?: string;
    /** Article body in wiki markup */
    wiki?: string;
    description?: string;
    /** Reference to kb_knowledge_base */
    kb_knowledge_base: string;
    /** Reference to kb_category */
    kb_category?: string;
    category?: string;
    workflow_state?: string;
    author?: string;
    article_type?: string;
    published?: string;
    active?: string;
    valid_to?: string;
    version?: string;
    display_number?: string;
    meta_description?: string;
    keywords?: string;
    sys_view_count?: string;
    use_count?: string;
    rating?: string;
    sys_created_on?: string;
    sys_updated_on?: string;
    sys_created_by?: string;
    sys_updated_by?: string;
    [key: string]: unknown;
}

/**
 * A lightweight article summary for list operations (excludes large body fields).
 */
export interface KnowledgeArticleSummary {
    sys_id: string;
    number?: string;
    short_description: string;
    kb_knowledge_base: string;
    kb_category?: string;
    workflow_state?: string;
    author?: string;
    article_type?: string;
    published?: string;
    active?: string;
    sys_view_count?: string;
    sys_created_on?: string;
    sys_updated_on?: string;
    [key: string]: unknown;
}

// ============================================================
// Options Types
// ============================================================

/**
 * Options for listing knowledge bases.
 */
export interface ListKnowledgeBasesOptions {
    /** Encoded query string for filtering */
    query?: string;
    /** Filter by active status */
    active?: boolean;
    /** Maximum number of records to return (default 20) */
    limit?: number;
    /** Offset for pagination (default 0) */
    offset?: number;
}

/**
 * Options for listing knowledge categories.
 */
export interface ListCategoriesOptions {
    /** Filter by knowledge base sys_id (kb_category.value field) */
    knowledgeBaseSysId?: string;
    /** Filter by parent category sys_id */
    parentCategory?: string;
    /** Encoded query string for additional filtering */
    query?: string;
    /** Filter by active status */
    active?: boolean;
    /** Maximum number of records (default 20) */
    limit?: number;
    /** Offset for pagination (default 0) */
    offset?: number;
}

/**
 * Options for creating a knowledge category.
 */
export interface CreateCategoryOptions {
    /** Category label (display name) */
    label: string;
    /** Knowledge base sys_id (stored in kb_category.value) */
    knowledgeBaseSysId: string;
    /** Parent category sys_id (stored in kb_category.parent_id) */
    parentCategory?: string;
    /** Whether the category is active (default true) */
    active?: boolean;
}

/**
 * Options for listing knowledge articles.
 */
export interface ListArticlesOptions {
    /** Filter by knowledge base sys_id */
    knowledgeBaseSysId?: string;
    /** Filter by category sys_id */
    categorySysId?: string;
    /** Filter by workflow state (e.g. "published", "draft", "retired") */
    workflowState?: string;
    /** Text search term (searches short_description) */
    textSearch?: string;
    /** Encoded query string for additional filtering */
    query?: string;
    /** Maximum number of records (default 20) */
    limit?: number;
    /** Offset for pagination (default 0) */
    offset?: number;
}

/**
 * Options for creating a knowledge article.
 */
export interface CreateArticleOptions {
    /** Article short description / title */
    shortDescription: string;
    /** Article body in HTML */
    text?: string;
    /** Article body in wiki markup */
    wiki?: string;
    /** Knowledge base sys_id */
    knowledgeBaseSysId: string;
    /** Category sys_id */
    categorySysId?: string;
    /** Workflow state (default "draft") */
    workflowState?: string;
    /** Article type */
    articleType?: string;
    /** Additional fields to set on the record */
    additionalFields?: Record<string, string>;
}

/**
 * Options for updating a knowledge article.
 */
export interface UpdateArticleOptions {
    /** Updated short description */
    shortDescription?: string;
    /** Updated article body in HTML */
    text?: string;
    /** Updated article body in wiki markup */
    wiki?: string;
    /** Updated knowledge base sys_id */
    knowledgeBaseSysId?: string;
    /** Updated category sys_id */
    categorySysId?: string;
    /** Updated workflow state */
    workflowState?: string;
    /** Updated article type */
    articleType?: string;
    /** Updated active status */
    active?: boolean;
    /** Additional fields to update */
    additionalFields?: Record<string, string>;
}

// ============================================================
// Result Types
// ============================================================

/**
 * Enriched knowledge base detail including article and category counts.
 */
export interface KnowledgeBaseDetail {
    knowledgeBase: KnowledgeBaseRecord;
    articleCount: number;
    categoryCount: number;
}

// ============================================================
// ServiceNow Response Wrappers
// ============================================================

export interface KnowledgeBaseResponse {
    result: KnowledgeBaseRecord[];
}

export interface KnowledgeBaseSingleResponse {
    result: KnowledgeBaseRecord;
}

export interface KnowledgeCategoryResponse {
    result: KnowledgeCategoryRecord[];
}

export interface KnowledgeCategorySingleResponse {
    result: KnowledgeCategoryRecord;
}

export interface KnowledgeArticleResponse {
    result: KnowledgeArticleRecord[];
}

export interface KnowledgeArticleSummaryResponse {
    result: KnowledgeArticleSummary[];
}

export interface KnowledgeArticleSingleResponse {
    result: KnowledgeArticleRecord;
}
