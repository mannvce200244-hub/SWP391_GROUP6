package com.m4n.backend.service;

import com.m4n.backend.entity.Artisan;
import com.m4n.backend.entity.CraftVillage;
import com.m4n.backend.repository.ArtisanRepository;
import com.m4n.backend.repository.CraftVillageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
class DiscoveryPaginationIntegrationTest {
    @Autowired private ArtisanService artisanService;
    @Autowired private CraftVillageService villageService;
    @Autowired private ArtisanRepository artisanRepository;
    @Autowired private CraftVillageRepository villageRepository;
    @Autowired private WebApplicationContext context;
    private MockMvc mvc;
    private String prefix;

    @BeforeEach
    void setUp() {
        prefix = "Discovery-" + UUID.randomUUID().toString().substring(0, 8);
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void artisanDatabasePagesHaveTrueTotalsAndStableNameTies() throws Exception {
        var one = artisanRepository.saveAndFlush(Artisan.builder().name(prefix).biography("First").build());
        var two = artisanRepository.saveAndFlush(Artisan.builder().name(prefix).biography("Second").build());
        var first = artisanService.searchArtisans(prefix, PageRequest.of(0, 1, Sort.by("name")));
        var second = artisanService.searchArtisans(prefix, PageRequest.of(1, 1, Sort.by("name")));
        assertThat(first.getTotalElements()).isEqualTo(2);
        assertThat(first.getTotalPages()).isEqualTo(2);
        assertThat(first.getContent().getFirst().id()).isEqualTo(one.getId());
        assertThat(second.getContent().getFirst().id()).isEqualTo(two.getId());
        mvc.perform(get("/api/v1/artisans/search").param("keyword", prefix).param("size", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content.length()").value(1));
        mvc.perform(get("/api/v1/artisans/{id}", two.getId()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.biography").value("Second"));
    }

    @Test
    void villageSearchCombinesLiteralKeywordWithExactPersistedLocation() throws Exception {
        String location = prefix + " Hà Nội";
        var matching = villageRepository.saveAndFlush(CraftVillage.builder().name(prefix + " 100%_\\")
                .location(location).description("Khớp ký tự literal").build());
        villageRepository.saveAndFlush(CraftVillage.builder().name(prefix + " 100Xabc")
                .location(location).build());
        villageRepository.saveAndFlush(CraftVillage.builder().name(prefix + " 100%_\\ khác")
                .location(location + " mở rộng").build());
        var result = villageService.searchCraftVillages(prefix + " 100%_\\", location, PageRequest.of(0, 1));
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().getFirst().id()).isEqualTo(matching.getId());
        assertThat(villageService.listLocations()).contains(location, location + " mở rộng");
        mvc.perform(get("/api/v1/craft-villages/search").param("keyword", prefix + " 100%_\\")
                .param("location", location).param("size", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/v1/craft-villages/locations"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[?(@ == '" + location + "')]").exists());
    }

    @Test
    void artisanWildcardCharactersAreLiteralAndEmptyPagesAreSuccessful() {
        artisanRepository.saveAndFlush(Artisan.builder().name(prefix + "%_").build());
        artisanRepository.saveAndFlush(Artisan.builder().name(prefix + "XA").build());
        var result = artisanService.searchArtisans(prefix + "%_", PageRequest.of(0, 2));
        assertThat(result.getTotalElements()).isEqualTo(1);
        var beyond = artisanService.searchArtisans(prefix, PageRequest.of(9, 1));
        assertThat(beyond.getContent()).isEmpty();
        assertThat(beyond.getTotalElements()).isEqualTo(2);
    }

    @Test
    void discoveryRejectsUnknownSortAndMissingDetail() throws Exception {
        mvc.perform(get("/api/v1/artisans/search").param("sort", "biography,asc"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/craft-villages/search").param("sort", "location,asc"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/artisans/{id}", Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    void oversizedDatabaseOffsetsReturnValidationInsteadOfInternalError() throws Exception {
        for (String endpoint : new String[]{"/api/v1/artisans/search", "/api/v1/craft-villages/search", "/api/v1/products"}) {
            mvc.perform(get(endpoint).param("page", "2147483647").param("size", "100"))
                    .andExpect(status().isBadRequest());
        }
    }
}
