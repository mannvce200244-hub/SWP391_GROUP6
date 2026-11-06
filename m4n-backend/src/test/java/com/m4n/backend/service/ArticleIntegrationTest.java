package com.m4n.backend.service;

import com.m4n.backend.dto.request.CreateArticleRequest;
import com.m4n.backend.dto.request.UpdateArticleRequest;
import com.m4n.backend.dto.response.AdminArticleDetailResponse;
import com.m4n.backend.entity.*;
import com.m4n.backend.exception.ResourceNotFoundException;
import com.m4n.backend.repository.ArtisanRepository;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
class ArticleIntegrationTest {
    @Autowired private ArticleService articleService;
    @Autowired private ArtisanRepository artisanRepository;
    @Autowired private Validator validator;
    @Autowired private WebApplicationContext context;
    private Artisan artisan;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        artisan = artisanRepository.saveAndFlush(Artisan.builder().name("Content test artisan").build());
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void draftsArePersistedButNeverPublicAndPublicationCanBeWithdrawn() throws Exception {
        var draft = create("Draft title", ArticleType.ARTICLE);
        Long id = draft.detail().article().id();
        assertThat(draft.status()).isEqualTo(ArticleStatus.DRAFT);
        assertThat(draft.detail().article().publishedAt()).isNull();
        assertThat(articleService.getAdminArticle(id).detail().content()).isEqualTo("Plain text content");
        mvc.perform(get("/api/v1/articles/{id}", id)).andExpect(status().isNotFound());
        assertThat(articleService.listPublishedArticles(null, null, artisan.getId(), null, 0, 12).getTotalElements()).isZero();

        var published = update(draft, ArticleStatus.PUBLISHED, "Published title");
        var publishedAt = published.detail().article().publishedAt();
        assertThat(publishedAt).isNotNull();
        mvc.perform(get("/api/v1/articles/{id}", id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.article.title").value("Published title"))
                .andExpect(jsonPath("$.version").doesNotExist())
                .andExpect(jsonPath("$.article.version").doesNotExist());
        var edited = update(published, ArticleStatus.PUBLISHED, "Edited title");
        assertThat(edited.detail().article().publishedAt()).isEqualTo(publishedAt);
        var withdrawn = update(edited, ArticleStatus.DRAFT, "Edited title");
        assertThat(withdrawn.detail().article().publishedAt()).isNull();
        assertThatThrownBy(() -> articleService.getPublishedArticle(id)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void publicPaginationAndAssociationFiltersExcludeDraftsInDatabase() throws Exception {
        create("Hidden title", ArticleType.GUIDE);
        update(create("Guide one", ArticleType.GUIDE), ArticleStatus.PUBLISHED, "Guide one");
        update(create("Guide two", ArticleType.GUIDE), ArticleStatus.PUBLISHED, "Guide two");
        update(create("Article title", ArticleType.ARTICLE), ArticleStatus.PUBLISHED, "Article title");
        var first = articleService.listPublishedArticles(ArticleType.GUIDE, null, artisan.getId(), null, 0, 1);
        var second = articleService.listPublishedArticles(ArticleType.GUIDE, null, artisan.getId(), null, 1, 1);
        assertThat(first.getTotalElements()).isEqualTo(2);
        assertThat(first.getContent()).hasSize(1);
        assertThat(second.getContent()).hasSize(1);
        assertThat(first.getContent().getFirst().id()).isNotEqualTo(second.getContent().getFirst().id());
        mvc.perform(get("/api/v1/articles").param("artisanId", artisan.getId().toString()).param("type", "GUIDE"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2));
        assertThatThrownBy(() -> articleService.listPublishedArticles(null, null, null, null, 0, 101))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void publicPagesOutsideDatabaseOffsetRangeReturnSafeBadRequest() throws Exception {
        mvc.perform(get("/api/v1/articles").param("page", String.valueOf(Integer.MAX_VALUE)).param("size", "100"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("giới hạn")));
        assertThatThrownBy(() -> articleService.listAdminArticles(null, null, null, null, null, Integer.MAX_VALUE, 100))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void staleUpdateAndDeleteCannotOverwriteOrRemoveNewerContent() {
        var draft = create("Original title", ArticleType.ARTICLE);
        var saved = update(draft, ArticleStatus.PUBLISHED, "Latest title");
        assertThat(saved.version()).isGreaterThan(draft.version());
        assertThatThrownBy(() -> update(draft, ArticleStatus.DRAFT, "Stale title")).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> articleService.deleteArticle(saved.detail().article().id(), draft.version())).isInstanceOf(IllegalStateException.class);
        assertThat(articleService.getAdminArticle(saved.detail().article().id()).detail().article().title()).isEqualTo("Latest title");
        articleService.deleteArticle(saved.detail().article().id(), saved.version());
        assertThatThrownBy(() -> articleService.getAdminArticle(saved.detail().article().id())).isInstanceOf(ResourceNotFoundException.class);
        assertThat(artisanRepository.existsById(artisan.getId())).isTrue();
    }

    @Test
    void invalidLinkedMasterDataIsRejectedWithoutCreatingContent() {
        var request = new CreateArticleRequest("Title", null, "Text", ArticleType.GUIDE, null, null, null, Long.MAX_VALUE, null);
        assertThatThrownBy(() -> articleService.createArticle(request)).isInstanceOf(ResourceNotFoundException.class);
        assertThat(articleService.listAdminArticles(null, null, null, artisan.getId(), null, 0, 20).getTotalElements()).isZero();
    }

    @Test
    void urlAndRequiredTextValidationRejectUnsafeInput() {
        for (String unsafe : new String[]{"javascript:alert(1)", "http://example.com/video", "//example.com", "https://user:pass@example.com", "https://example.com/a b", "https://example.com:70000"}) {
            var request = new CreateArticleRequest("Title", null, "Text", ArticleType.GUIDE, unsafe, null, null, null, null);
            assertThat(validator.validate(request)).anyMatch(v -> v.getPropertyPath().toString().equals("imageUrl"));
        }
        var valid = new CreateArticleRequest("Title", null, "<script>Plain text only</script>", ArticleType.GUIDE,
                "https://example.com/image.jpg", "https://example.com/video", null, null, null);
        assertThat(validator.validate(valid)).isEmpty();
        assertThat(validator.validate(new CreateArticleRequest("  ", null, " ", ArticleType.GUIDE, null, null, null, null, null))).hasSize(2);
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void customerCannotReadOrMutateAdminContent() throws Exception {
        mvc.perform(get("/api/v1/admin/articles")).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/admin/articles").contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/v1/admin/articles/1").contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/admin/articles/1").param("expectedVersion", "0"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ONLINE_STAFF")
    void staffCannotManageCulturalContent() throws Exception {
        mvc.perform(get("/api/v1/admin/articles")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanReadDraftAndReceivesFieldErrorsForInvalidContent() throws Exception {
        var draft = create("Draft title", ArticleType.ARTICLE);
        mvc.perform(get("/api/v1/admin/articles/{id}", draft.detail().article().id()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.version").isNumber());
        mvc.perform(post("/api/v1/admin/articles").contentType("application/json")
                        .content("{\"title\":\"Title\",\"content\":\"Text\",\"type\":\"GUIDE\",\"videoUrl\":\"javascript:alert(1)\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.videoUrl").exists());
    }

    private AdminArticleDetailResponse create(String title, ArticleType type) {
        return articleService.createArticle(new CreateArticleRequest(title, "Summary", "Plain text content", type,
                null, null, null, artisan.getId(), null));
    }

    private AdminArticleDetailResponse update(AdminArticleDetailResponse source, ArticleStatus status, String title) {
        var article = source.detail().article();
        return articleService.updateArticle(article.id(), new UpdateArticleRequest(title, article.summary(), source.detail().content(),
                article.type(), article.imageUrl(), source.detail().videoUrl(), article.productId(), article.artisanId(),
                article.craftVillageId(), status, source.version()));
    }
}
