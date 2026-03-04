import { ServiceNowInstance } from "../ServiceNowInstance";
import { Logger } from "../../util/Logger";
import { ServiceNowRequest } from "../../comm/http/ServiceNowRequest";
import { TableAPIRequest } from "../../comm/http/TableAPIRequest";
import { AggregateQuery } from "../aggregate/AggregateQuery";
import { IHttpResponse } from "../../comm/http/IHttpResponse";
import {
    KnowledgeBaseRecord,
    KnowledgeBaseResponse,
    KnowledgeBaseDetail,
    KnowledgeCategoryRecord,
    KnowledgeCategoryResponse,
    KnowledgeCategorySingleResponse,
    KnowledgeArticleRecord,
    KnowledgeArticleResponse,
    KnowledgeArticleSummary,
    KnowledgeArticleSummaryResponse,
    KnowledgeArticleSingleResponse,
    ListKnowledgeBasesOptions,
    ListCategoriesOptions,
    CreateCategoryOptions,
    ListArticlesOptions,
    CreateArticleOptions,
    UpdateArticleOptions
} from './KnowledgeModels';

/**
 * Provides operations for managing ServiceNow Knowledge Base articles,
 * knowledge bases, and categories via the Table API and Stats API.
 */
export class KnowledgeManager {
    private static readonly KB_BASE_TABLE = 'kb_knowledge_base';
    private static readonly KB_CATEGORY_TABLE = 'kb_category';
    private static readonly KB_KNOWLEDGE_TABLE = 'kb_knowledge';

    /** Fields to return in list operations (excludes large body fields) */
    private static readonly ARTICLE_LIST_FIELDS =
        'sys_id,number,short_description,kb_knowledge_base,kb_category,workflow_state,' +
        'author,article_type,published,active,sys_view_count,sys_created_on,sys_updated_on';

    private _logger: Logger = new Logger("KnowledgeManager");
    private _req: ServiceNowRequest;
    private _tableAPI: TableAPIRequest;
    private _aggregateQuery: AggregateQuery;
    private _instance: ServiceNowInstance;

    public constructor(instance: ServiceNowInstance) {
        this._instance = instance;
        this._req = new ServiceNowRequest(instance);
        this._tableAPI = new TableAPIRequest(instance);
        this._aggregateQuery = new AggregateQuery(instance);
    }

    /**
     * List knowledge bases with optional filtering and pagination.
     *
     * @param options Filtering and pagination options
     * @returns Array of knowledge base records
     * @throws Error if the API call fails
     */
    public async listKnowledgeBases(options: ListKnowledgeBasesOptions = {}): Promise<KnowledgeBaseRecord[]> {
        const { query, active, limit = 20, offset = 0 } = options;
        this._logger.info('Listing knowledge bases');

        const queryParts: string[] = [];
        if (active !== undefined) queryParts.push(`active=${active}`);
        if (query) queryParts.push(query);

        const params: Record<string, string | number> = {
            sysparm_limit: limit,
            sysparm_offset: offset
        };
        if (queryParts.length > 0) {
            params.sysparm_query = queryParts.join('^');
        }

        const response: IHttpResponse<KnowledgeBaseResponse> = await this._tableAPI.get<KnowledgeBaseResponse>(
            KnowledgeManager.KB_BASE_TABLE, params
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Retrieved ${response.bodyObject.result.length} knowledge bases`);
            return response.bodyObject.result;
        }

        throw new Error(`Failed to list knowledge bases. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * Get details of a specific knowledge base including article and category counts.
     *
     * @param sysId The sys_id of the knowledge base
     * @returns Knowledge base detail with article and category counts
     * @throws Error if the sys_id is empty, the KB is not found, or the API call fails
     */
    public async getKnowledgeBase(sysId: string): Promise<KnowledgeBaseDetail> {
        if (!sysId || sysId.trim().length === 0) {
            throw new Error('Knowledge base sys_id is required');
        }

        this._logger.info(`Getting knowledge base: ${sysId}`);

        const query: Record<string, string | number> = {
            sysparm_query: `sys_id=${sysId}`,
            sysparm_limit: 1
        };

        const response: IHttpResponse<KnowledgeBaseResponse> = await this._tableAPI.get<KnowledgeBaseResponse>(
            KnowledgeManager.KB_BASE_TABLE, query
        );

        if (!response || response.status !== 200 || !response.bodyObject?.result ||
            response.bodyObject.result.length === 0) {
            throw new Error(`Knowledge base '${sysId}' not found. Status: ${response?.status ?? 'unknown'}`);
        }

        const knowledgeBase = response.bodyObject.result[0];

        // Get article and category counts in parallel
        const [articleCount, categoryCount] = await Promise.all([
            this._aggregateQuery.count({
                table: KnowledgeManager.KB_KNOWLEDGE_TABLE,
                query: `kb_knowledge_base=${sysId}`
            }),
            this._aggregateQuery.count({
                table: KnowledgeManager.KB_CATEGORY_TABLE,
                query: `value=${sysId}`
            })
        ]);

        this._logger.info(`Knowledge base '${knowledgeBase.title}': ${articleCount} articles, ${categoryCount} categories`);

        return { knowledgeBase, articleCount, categoryCount };
    }

    /**
     * List categories within a knowledge base with optional filtering.
     *
     * @param options Filtering and pagination options
     * @returns Array of category records
     * @throws Error if the API call fails
     */
    public async listCategories(options: ListCategoriesOptions = {}): Promise<KnowledgeCategoryRecord[]> {
        const { knowledgeBaseSysId, parentCategory, query, active, limit = 20, offset = 0 } = options;
        this._logger.info('Listing categories');

        const queryParts: string[] = [];
        if (knowledgeBaseSysId) queryParts.push(`value=${knowledgeBaseSysId}`);
        if (parentCategory) queryParts.push(`parent_id=${parentCategory}`);
        if (active !== undefined) queryParts.push(`active=${active}`);
        if (query) queryParts.push(query);

        const params: Record<string, string | number> = {
            sysparm_limit: limit,
            sysparm_offset: offset
        };
        if (queryParts.length > 0) {
            params.sysparm_query = queryParts.join('^');
        }

        const response: IHttpResponse<KnowledgeCategoryResponse> = await this._tableAPI.get<KnowledgeCategoryResponse>(
            KnowledgeManager.KB_CATEGORY_TABLE, params
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Retrieved ${response.bodyObject.result.length} categories`);
            return response.bodyObject.result;
        }

        throw new Error(`Failed to list categories. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * Create a new knowledge base category.
     *
     * @param options Category creation options
     * @returns The created category record
     * @throws Error if required fields are missing or the API call fails
     */
    public async createCategory(options: CreateCategoryOptions): Promise<KnowledgeCategoryRecord> {
        if (!options.label || options.label.trim().length === 0) {
            throw new Error('Category label is required');
        }
        if (!options.knowledgeBaseSysId || options.knowledgeBaseSysId.trim().length === 0) {
            throw new Error('Knowledge base sys_id is required');
        }

        this._logger.info(`Creating category: ${options.label}`);

        const body: Record<string, string> = {
            label: options.label,
            value: options.knowledgeBaseSysId
        };
        if (options.parentCategory) {
            body.parent_id = options.parentCategory;
        }
        if (options.active !== undefined) {
            body.active = String(options.active);
        }

        const response: IHttpResponse<KnowledgeCategorySingleResponse> = await this._tableAPI.post<KnowledgeCategorySingleResponse>(
            KnowledgeManager.KB_CATEGORY_TABLE, {}, body
        );

        if (response && (response.status === 200 || response.status === 201) && response.bodyObject?.result) {
            this._logger.info(`Created category: ${options.label} (${response.bodyObject.result.sys_id})`);
            return response.bodyObject.result;
        }

        throw new Error(`Failed to create category '${options.label}'. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * List knowledge articles with filtering by KB, category, workflow state, and text search.
     * Returns article summaries (without large body fields) for efficiency.
     *
     * @param options Filtering and pagination options
     * @returns Array of article summaries
     * @throws Error if the API call fails
     */
    public async listArticles(options: ListArticlesOptions = {}): Promise<KnowledgeArticleSummary[]> {
        const { knowledgeBaseSysId, categorySysId, workflowState, textSearch, query, limit = 20, offset = 0 } = options;
        this._logger.info('Listing articles');

        const queryParts: string[] = [];
        if (knowledgeBaseSysId) queryParts.push(`kb_knowledge_base=${knowledgeBaseSysId}`);
        if (categorySysId) queryParts.push(`kb_category=${categorySysId}`);
        if (workflowState) queryParts.push(`workflow_state=${workflowState}`);
        if (textSearch) queryParts.push(`short_descriptionLIKE${textSearch}`);
        if (query) queryParts.push(query);

        const params: Record<string, string | number> = {
            sysparm_limit: limit,
            sysparm_offset: offset,
            sysparm_fields: KnowledgeManager.ARTICLE_LIST_FIELDS
        };
        if (queryParts.length > 0) {
            params.sysparm_query = queryParts.join('^');
        }

        const response: IHttpResponse<KnowledgeArticleSummaryResponse> = await this._tableAPI.get<KnowledgeArticleSummaryResponse>(
            KnowledgeManager.KB_KNOWLEDGE_TABLE, params
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Retrieved ${response.bodyObject.result.length} articles`);
            return response.bodyObject.result;
        }

        throw new Error(`Failed to list articles. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * Get full article content including body text.
     *
     * @param sysId The sys_id of the article
     * @returns The full article record
     * @throws Error if the sys_id is empty, the article is not found, or the API call fails
     */
    public async getArticle(sysId: string): Promise<KnowledgeArticleRecord> {
        if (!sysId || sysId.trim().length === 0) {
            throw new Error('Article sys_id is required');
        }

        this._logger.info(`Getting article: ${sysId}`);

        const query: Record<string, string | number> = {
            sysparm_query: `sys_id=${sysId}`,
            sysparm_limit: 1
        };

        const response: IHttpResponse<KnowledgeArticleResponse> = await this._tableAPI.get<KnowledgeArticleResponse>(
            KnowledgeManager.KB_KNOWLEDGE_TABLE, query
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            if (response.bodyObject.result.length > 0) {
                this._logger.info(`Found article: ${response.bodyObject.result[0].short_description}`);
                return response.bodyObject.result[0];
            }
            throw new Error(`Article '${sysId}' not found`);
        }

        throw new Error(`Failed to get article '${sysId}'. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * Create a new knowledge article.
     *
     * @param options Article creation options
     * @returns The created article record
     * @throws Error if required fields are missing or the API call fails
     */
    public async createArticle(options: CreateArticleOptions): Promise<KnowledgeArticleRecord> {
        if (!options.shortDescription || options.shortDescription.trim().length === 0) {
            throw new Error('Article short description is required');
        }
        if (!options.knowledgeBaseSysId || options.knowledgeBaseSysId.trim().length === 0) {
            throw new Error('Knowledge base sys_id is required');
        }

        this._logger.info(`Creating article: ${options.shortDescription}`);

        const body: Record<string, string> = {
            short_description: options.shortDescription,
            kb_knowledge_base: options.knowledgeBaseSysId,
            workflow_state: options.workflowState || 'draft'
        };
        if (options.text) body.text = options.text;
        if (options.wiki) body.wiki = options.wiki;
        if (options.categorySysId) body.kb_category = options.categorySysId;
        if (options.articleType) body.article_type = options.articleType;
        if (options.additionalFields) {
            Object.assign(body, options.additionalFields);
        }

        const response: IHttpResponse<KnowledgeArticleSingleResponse> = await this._tableAPI.post<KnowledgeArticleSingleResponse>(
            KnowledgeManager.KB_KNOWLEDGE_TABLE, {}, body
        );

        if (response && (response.status === 200 || response.status === 201) && response.bodyObject?.result) {
            this._logger.info(`Created article: ${options.shortDescription} (${response.bodyObject.result.sys_id})`);
            return response.bodyObject.result;
        }

        throw new Error(`Failed to create article. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * Update an existing knowledge article.
     *
     * @param sysId The sys_id of the article to update
     * @param options Fields to update
     * @returns The updated article record
     * @throws Error if the sys_id is empty, no fields are provided, or the API call fails
     */
    public async updateArticle(sysId: string, options: UpdateArticleOptions): Promise<KnowledgeArticleRecord> {
        if (!sysId || sysId.trim().length === 0) {
            throw new Error('Article sys_id is required');
        }

        this._logger.info(`Updating article: ${sysId}`);

        const body: Record<string, string> = {};
        if (options.shortDescription !== undefined) body.short_description = options.shortDescription;
        if (options.text !== undefined) body.text = options.text;
        if (options.wiki !== undefined) body.wiki = options.wiki;
        if (options.knowledgeBaseSysId !== undefined) body.kb_knowledge_base = options.knowledgeBaseSysId;
        if (options.categorySysId !== undefined) body.kb_category = options.categorySysId;
        if (options.workflowState !== undefined) body.workflow_state = options.workflowState;
        if (options.articleType !== undefined) body.article_type = options.articleType;
        if (options.active !== undefined) body.active = String(options.active);
        if (options.additionalFields) {
            Object.assign(body, options.additionalFields);
        }

        if (Object.keys(body).length === 0) {
            throw new Error('At least one field must be provided for update');
        }

        const response: IHttpResponse<KnowledgeArticleSingleResponse> = await this._tableAPI.put<KnowledgeArticleSingleResponse>(
            KnowledgeManager.KB_KNOWLEDGE_TABLE, sysId, body
        );

        if (response && response.status === 200 && response.bodyObject?.result) {
            this._logger.info(`Updated article: ${sysId}`);
            return response.bodyObject.result;
        }

        throw new Error(`Failed to update article '${sysId}'. Status: ${response?.status ?? 'unknown'}`);
    }

    /**
     * Publish a draft article by setting its workflow_state to "published".
     *
     * @param sysId The sys_id of the article to publish
     * @returns The updated article record
     * @throws Error if the sys_id is empty or the API call fails
     */
    public async publishArticle(sysId: string): Promise<KnowledgeArticleRecord> {
        if (!sysId || sysId.trim().length === 0) {
            throw new Error('Article sys_id is required');
        }

        this._logger.info(`Publishing article: ${sysId}`);

        return this.updateArticle(sysId, { workflowState: 'published' });
    }
}
