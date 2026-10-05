package com.m4n.backend.config;

import com.m4n.backend.entity.Artisan;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.CraftVillage;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.MediaType;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductMedia;
import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.repository.ArtisanRepository;
import com.m4n.backend.repository.CategoryRepository;
import com.m4n.backend.repository.CraftVillageRepository;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Seed data runner for development and testing environments.
 * Idempotently initializes default roles and diverse test accounts.
 */
@Slf4j
@Component
public class DataSeeder implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CategoryRepository categoryRepository;
    private final CraftVillageRepository craftVillageRepository;
    private final ArtisanRepository artisanRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    @Value("${m4n.seed.dev-accounts:true}")
    private boolean seedDevAccounts;

    @Value("${M4N_DEFAULT_TEST_PASSWORD:Password123!}")
    private String defaultPassword;

    public DataSeeder(
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            CategoryRepository categoryRepository,
            CraftVillageRepository craftVillageRepository,
            ArtisanRepository artisanRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.categoryRepository = categoryRepository;
        this.craftVillageRepository = craftVillageRepository;
        this.artisanRepository = artisanRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initRoles();
        initProducts();
        if (seedDevAccounts) {
            initDevAccounts();
            printTestAccountsSummary();
        }
    }

    private void initRoles() {
        for (RoleName roleName : RoleName.values()) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                String description = switch (roleName) {
                    case ADMIN -> "Quản trị viên hệ thống M4N";
                    case ONLINE_STAFF -> "Nhân viên xử lý đơn hàng trực tuyến";
                    case POS_STAFF -> "Nhân viên bán hàng tại showroom POS";
                    case CUSTOMER -> "Khách hàng mua sắm nhạc cụ truyền thống";
                };

                Role role = Role.builder()
                        .name(roleName)
                        .description(description)
                        .build();
                roleRepository.save(role);
                log.info("Initialized system role: {}", roleName);
            }
        }
    }

    private void initDevAccounts() {
        // 1. Quản trị viên (ADMIN)
        seedAccountIfNotExists(
                "admin@m4n.vn",
                defaultPassword,
                "Quản Trị Viên Hệ Thống",
                "0900000001",
                "12 Phố Tràng Tiền, Hoàn Kiếm, Hà Nội",
                RoleName.ADMIN,
                true
        );

        // 2. Nhân viên bán hàng Online chính (ONLINE_STAFF)
        seedAccountIfNotExists(
                "staff@m4n.vn",
                defaultPassword,
                "Nhân Viên Bán Hàng Online",
                "0900000002",
                "88 Đường Bạch Đằng, Hải Châu, Đà Nẵng",
                RoleName.ONLINE_STAFF,
                true
        );

        // 3. Nhân viên bán hàng Online phụ (ONLINE_STAFF)
        seedAccountIfNotExists(
                "staff2@m4n.vn",
                defaultPassword,
                "Lê Thu Hà (Online Staff)",
                "0900000022",
                "45 Đường Nguyễn Văn Linh, Đà Nẵng",
                RoleName.ONLINE_STAFF,
                true
        );

        // 4. Nhân viên Showroom POS chính (POS_STAFF)
        seedAccountIfNotExists(
                "pos@m4n.vn",
                defaultPassword,
                "Nhân Viên Showroom POS",
                "0900000003",
                "150 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh",
                RoleName.POS_STAFF,
                true
        );

        // 5. Nhân viên Showroom POS phụ (POS_STAFF)
        seedAccountIfNotExists(
                "pos2@m4n.vn",
                defaultPassword,
                "Trần Quốc Bảo (POS Staff)",
                "0900000033",
                "22 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
                RoleName.POS_STAFF,
                true
        );

        // 6. Khách hàng mẫu 1 (CUSTOMER - đầy đủ thông tin)
        seedAccountIfNotExists(
                "customer@m4n.vn",
                defaultPassword,
                "Nguyễn Văn Khách",
                "0900000004",
                "68 Đường Lê Lợi, TP. Huế, Thừa Thiên Huế",
                RoleName.CUSTOMER,
                true
        );

        // 7. Khách hàng mẫu 2 (CUSTOMER - Hà Nội)
        seedAccountIfNotExists(
                "customer2@m4n.vn",
                defaultPassword,
                "Trần Thị Mai Phương",
                "0987654321",
                "45 Phố Hàng Gai, Hoàn Kiếm, Hà Nội",
                RoleName.CUSTOMER,
                true
        );

        // 8. Tài khoản bị khóa (CUSTOMER - isActive = false để test kiểm tra 403 Forbidden)
        seedAccountIfNotExists(
                "locked@m4n.vn",
                defaultPassword,
                "Tài Khoản Bị Khóa (Testing 403)",
                "0911223344",
                "10 Đường Lạch Tray, Ngô Quyền, Hải Phòng",
                RoleName.CUSTOMER,
                false
        );
    }

    private void seedAccountIfNotExists(
            String email,
            String password,
            String fullName,
            String phone,
            String address,
            RoleName roleName,
            boolean isActive
    ) {
        String normalizedEmail = email.trim().toLowerCase();
        if (!userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new IllegalStateException("Role not found: " + roleName));

            User user = User.builder()
                    .email(normalizedEmail)
                    .password(passwordEncoder.encode(password))
                    .fullName(fullName)
                    .phone(phone)
                    .address(address)
                    .isActive(isActive)
                    .role(role)
                    .build();

            userRepository.save(user);
            log.info("Seeded test account: {} [Role: {}, Active: {}]", normalizedEmail, roleName, isActive);
        }
    }

    private void initProducts() {
        // 1. Categories
        Category catDay = categoryRepository.findByCodeIgnoreCase("DAY")
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .code("DAY")
                        .name("Nhạc cụ dây")
                        .description("Các nhạc cụ sử dụng dây rung phát ra âm thanh như đàn tranh, đàn bầu, đàn nguyệt, đàn tỳ bà.")
                        .build()));

        Category catHoi = categoryRepository.findByCodeIgnoreCase("HOI")
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .code("HOI")
                        .name("Nhạc cụ hơi")
                        .description("Các nhạc cụ dùng luồng hơi thổi như sáo trúc, tiêu, kèn bóp.")
                        .build()));

        Category catGo = categoryRepository.findByCodeIgnoreCase("GO")
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .code("GO")
                        .name("Nhạc cụ gõ")
                        .description("Các nhạc cụ định âm và giữ nhịp như trống, thanh la, mõ, chuông.")
                        .build()));

        // 2. Craft Villages
        CraftVillage villageDaoXa = craftVillageRepository.findByNameIgnoreCase("Làng Đào Xá")
                .orElseGet(() -> craftVillageRepository.save(CraftVillage.builder()
                        .name("Làng Đào Xá")
                        .location("Ứng Hòa, Hà Nội")
                        .description("Làng nghề làm đàn Đào Xá có lịch sử hơn 200 năm, nổi danh khắp cả nước với kỹ nghệ làm đàn truyền thống tinh xảo.")
                        .imageUrl("/assets/images/artisan-workshop.jpg")
                        .build()));

        CraftVillage villageTrucSon = craftVillageRepository.findByNameIgnoreCase("Làng nghề Trúc Sơn")
                .orElseGet(() -> craftVillageRepository.save(CraftVillage.builder()
                        .name("Làng nghề Trúc Sơn")
                        .location("Chương Mỹ, Hà Nội")
                        .description("Cái nôi chế tác sáo trúc và nhạc cụ hơi từ nứa, trúc tự nhiên truyền thống vùng đồng bằng Bắc Bộ.")
                        .imageUrl("/assets/images/cat-nhac-cu-hoi.jpg")
                        .build()));

        craftVillageRepository.findByNameIgnoreCase("Làng gốm sứ Bát Tràng")
                .orElseGet(() -> craftVillageRepository.save(CraftVillage.builder()
                        .name("Làng gốm sứ Bát Tràng")
                        .location("Gia Lâm, Hà Nội")
                        .description("Làng gốm cổ truyền ven sông Hồng với bề dày hơn 700 năm, nổi danh với kỹ nghệ vuốt tay, men lam, men rạn.")
                        .imageUrl("/assets/images/auth-craft-showcase.jpg")
                        .build()));

        craftVillageRepository.findByNameIgnoreCase("Làng lụa Vạn Phúc")
                .orElseGet(() -> craftVillageRepository.save(CraftVillage.builder()
                        .name("Làng lụa Vạn Phúc")
                        .location("Hà Đông, Hà Nội")
                        .description("Làng dệt tơ lụa trứ danh bên bờ sông Nhuệ, nổi tiếng với lụa vân mềm mịn, hoa văn chìm tinh tế.")
                        .imageUrl("/assets/images/hero-dan-tranh.jpg")
                        .build()));

        craftVillageRepository.findByNameIgnoreCase("Làng mây tre đan Phú Vinh")
                .orElseGet(() -> craftVillageRepository.save(CraftVillage.builder()
                        .name("Làng mây tre đan Phú Vinh")
                        .location("Chương Mỹ, Hà Nội")
                        .description("Nơi những sợi mây, nan tre mộc mạc qua bàn tay tài hoa biến hóa thành những tác phẩm mỹ nghệ uốn lượn uyển chuyển.")
                        .imageUrl("/assets/images/cat-nhac-cu-day.jpg")
                        .build()));

        craftVillageRepository.findByNameIgnoreCase("Làng đá mỹ nghệ Non Nước")
                .orElseGet(() -> craftVillageRepository.save(CraftVillage.builder()
                        .name("Làng đá mỹ nghệ Non Nước")
                        .location("Ngũ Hành Sơn, Đà Nẵng")
                        .description("Tọa lạc dưới chân núi Ngũ Hành Sơn, nơi các thế hệ nghệ nhân thổi hồn vào từng khối đá cẩm thạch tự nhiên.")
                        .imageUrl("/assets/images/artisan-workshop.jpg")
                        .build()));

        craftVillageRepository.findByNameIgnoreCase("Làng mộc mỹ nghệ Kim Bồng")
                .orElseGet(() -> craftVillageRepository.save(CraftVillage.builder()
                        .name("Làng mộc mỹ nghệ Kim Bồng")
                        .location("Hội An, Quảng Nam")
                        .description("Làng nghề mộc cổ truyền bên dòng sông Thu Bồn, nơi từng đóng góp công sức xây dựng nên quần thể kiến trúc phố cổ Hội An.")
                        .imageUrl("/assets/images/cat-nhac-cu-go.jpg")
                        .build()));

        craftVillageRepository.findByNameIgnoreCase("Làng tranh dân gian Đông Hồ")
                .orElseGet(() -> craftVillageRepository.save(CraftVillage.builder()
                        .name("Làng tranh dân gian Đông Hồ")
                        .location("Thuận Thành, Bắc Ninh")
                        .description("Di sản tranh in mộc bản trên giấy điệp tự nhiên, lưu giữ những ước vọng mộc mạc và triết lý sống nhân văn của người Việt xứ Kinh Bắc.")
                        .imageUrl("/assets/images/auth-dan-bau.jpg")
                        .build()));

        // 3. Artisans
        Artisan artisanQuy = artisanRepository.findByNameIgnoreCase("Nghệ nhân Nguyễn Văn Quý")
                .orElseGet(() -> artisanRepository.save(Artisan.builder()
                        .name("Nghệ nhân Nguyễn Văn Quý")
                        .craftVillage(villageDaoXa)
                        .biography("Nghệ nhân ưu tú với hơn 40 năm gắn bó với nghề làm đàn tranh và đàn bầu, truyền nhân đời thứ 4 làng Đào Xá.")
                        .avatarUrl(null)
                        .build()));

        Artisan artisanKhanh = artisanRepository.findByNameIgnoreCase("Nghệ nhân Phạm Chí Khánh")
                .orElseGet(() -> artisanRepository.save(Artisan.builder()
                        .name("Nghệ nhân Phạm Chí Khánh")
                        .craftVillage(villageDaoXa)
                        .biography("Bậc thầy chế tác độc huyền cầm, đạt nhiều giải thưởng thủ công mỹ nghệ quốc gia.")
                        .avatarUrl(null)
                        .build()));

        Artisan artisanPhong = artisanRepository.findByNameIgnoreCase("Nghệ nhân Trần Văn Phong")
                .orElseGet(() -> artisanRepository.save(Artisan.builder()
                        .name("Nghệ nhân Trần Văn Phong")
                        .craftVillage(villageDaoXa)
                        .biography("Chuyên gia chế tác đàn nguyệt cổ truyền và phục hồi các dòng đàn cổ.")
                        .avatarUrl(null)
                        .build()));

        Artisan artisanBuiKhanh = artisanRepository.findByNameIgnoreCase("Nghệ nhân Bùi Quốc Khánh")
                .orElseGet(() -> artisanRepository.save(Artisan.builder()
                        .name("Nghệ nhân Bùi Quốc Khánh")
                        .craftVillage(villageTrucSon)
                        .biography("Nghệ nhân chế tác sáo trúc biểu diễn chuyên nghiệp cho các dàn nhạc dân tộc.")
                        .avatarUrl(null)
                        .build()));

        // 4. Products & Inventories
        seedProductIfNotExists(
                "TRN-001",
                "Đàn Tranh 16 Dây",
                new BigDecimal("8500000"),
                "Đàn Tranh 16 dây là biểu tượng của âm nhạc truyền thống cung đình và thính phòng Việt Nam. Cây đàn được chế tác thủ công từ gỗ cẩm lai tự nhiên qua xử lý chống cong vênh mối mọt, mặt đàn làm từ gỗ ngô đồng phơi sương tạo độ cộng hưởng ngân vang trong trẻo và thanh thoát. Khảm ốc xà cừ hoa văn rồng phụng tinh xảo dọc thân đàn bởi các bậc thầy làng nghề Đào Xá.",
                "Gỗ cẩm lai khảm xà cừ, mặt gỗ ngô đồng, ngựa đàn bằng xương trâu",
                "115 cm × 22 cm × 18 cm, trọng lượng 4.5 kg",
                "3 quãng tám (G3 - D6)",
                "Làng Đào Xá, Hà Nội, Việt Nam",
                catDay,
                artisanQuy,
                villageDaoXa,
                List.of(
                        ProductMedia.builder().mediaType(MediaType.IMAGE).url("/assets/images/prod-dan-tranh.jpg").altText("Toàn cảnh Đàn Tranh 16 Dây gỗ cẩm lai khảm xà cừ").sortOrder(1).build(),
                        ProductMedia.builder().mediaType(MediaType.IMAGE).url("/assets/images/hero-dan-tranh.jpg").altText("Mặt gỗ ngô đồng và hệ thống nhạn đàn tinh xảo").sortOrder(2).build(),
                        ProductMedia.builder().mediaType(MediaType.IMAGE).url("/assets/images/cat-nhac-cu-day.jpg").altText("Chi tiết dây đàn và đầu cắm trục tinh xảo").sortOrder(3).build(),
                        ProductMedia.builder().mediaType(MediaType.IMAGE).url("/assets/images/auth-craft-showcase.jpg").altText("Kỹ nghệ khảm ốc xà cừ thủ công Đào Xá").sortOrder(4).build(),
                        ProductMedia.builder().mediaType(MediaType.IMAGE).url("/assets/images/artisan-workshop.jpg").altText("Không gian chế tác nhạc cụ tại xưởng nghệ nhân").sortOrder(5).build()
                ),
                15
        );

        seedProductIfNotExists(
                "BAU-001",
                "Đàn Bầu Gỗ Mun",
                new BigDecimal("6200000"),
                "Đàn Bầu (Độc huyền cầm) là nhạc cụ độc đáo chỉ có một dây nhưng tạo nên muôn vàn thanh âm trầm bổng, da diết như tiếng ru và hơi thở dân tộc. Thân đàn bằng gỗ mun sừng đen tuyền cứng chắc, vòi đàn uốn dẻo bằng sừng trâu thật giúp biểu đạt trọn vẹn những nốt luyến láy tinh tế của dân ca ba miền.",
                "Gỗ mun sừng tuyển chọn, bầu đàn bằng vỏ bầu nậm tự nhiên, cần đàn bằng sừng trâu đen",
                "105 cm × 12 cm × 14 cm, trọng lượng 3.2 kg",
                "Hệ thống bồi âm phong phú, linh hoạt trên nền âm thanh gốc",
                "Hà Nội, Việt Nam",
                catDay,
                artisanKhanh,
                villageDaoXa,
                List.of(
                        ProductMedia.builder().mediaType(MediaType.IMAGE).url("/assets/images/prod-dan-bau.jpg").altText("Đàn Bầu Gỗ Mun cẩn hoa văn truyền thống").sortOrder(1).build(),
                        ProductMedia.builder().mediaType(MediaType.IMAGE).url("/assets/images/auth-dan-bau.jpg").altText("Chi tiết cần đàn sừng trâu").sortOrder(2).build()
                ),
                8
        );

        seedProductIfNotExists(
                "NGU-001",
                "Đàn Nguyệt Gỗ Gụ",
                new BigDecimal("5800000"),
                "Đàn Nguyệt (Đàn Kìm) giữ vai trò chủ đạo trong âm nhạc Chầu Văn, Đờn ca tài tử và Cải lương. Tiếng đàn ấm áp, chắc nịch nhưng vô cùng tình cảm. Cần đàn dài với các phím cao đặc trưng cho phép nhấn nhá tạo những nốt rung và vuốt duyên dáng.",
                "Gỗ gụ mật lâu năm, mặt đàn gỗ ngô đồng mỏng nhẹ, phím đàn bằng tre già",
                "Đường kính thùng 36 cm, cần đàn dài 75 cm",
                "Hơn 2 quãng tám (C3 - G5)",
                "Làng Đào Xá, Hà Nội",
                catDay,
                artisanPhong,
                villageDaoXa,
                List.of(
                        ProductMedia.builder().mediaType(MediaType.IMAGE).url("/assets/images/prod-dan-nguyet.jpg").altText("Đàn Nguyệt Gỗ Gụ âm sắc cổ truyền").sortOrder(1).build(),
                        ProductMedia.builder().mediaType(MediaType.IMAGE).url("/assets/images/thanh-am-dan-nguyet.jpg").altText("Hộp cộng hưởng đàn nguyệt").sortOrder(2).build()
                ),
                12
        );

        seedProductIfNotExists(
                "SAO-001",
                "Sáo Trúc Tone C",
                new BigDecimal("650000"),
                "Sáo Trúc tone C (Đô) chuẩn âm hòa tấu 440Hz, âm thanh tròn trịa, rung ấm ở quãng trầm và réo rắt trong sáng ở quãng cao. Được chế tác từ nứa già phơi tự nhiên nhiều năm, lỗ bấm khoét thủ công chuẩn xác cho việc biểu diễn chuyên nghiệp lẫn thưởng thức.",
                "Nứa nam già trên 5 năm tuổi, quấn chỉ đen bảo vệ",
                "Dài 52 cm, đường kính lòng trong 13.5 mm",
                "Gần 3 quãng tám (C4 - G6)",
                "Chương Mỹ, Hà Nội",
                catHoi,
                artisanBuiKhanh,
                villageTrucSon,
                List.of(
                        ProductMedia.builder().mediaType(MediaType.IMAGE).url("/assets/images/prod-sao-truc.jpg").altText("Sáo Trúc Tone C nứa già quấn chỉ đen").sortOrder(1).build()
                ),
                30
        );

        seedProductIfNotExists(
                "TIEU-001",
                "Tiêu Bát Khổng Nứa Bắc",
                new BigDecimal("750000"),
                "Cây tiêu bát khổng chế tác từ thân nứa bắc tự nhiên tròn đều, thành ống dày dặn, âm sắc trầm ấm mộc mạc.",
                "Nứa bắc già phơi sương, quấn chỉ dù bảo vệ",
                "Dài 70 cm, đường kính lòng trong 18 mm",
                "2 quãng tám rưỡi (D4 - A6)",
                "Chương Mỹ, Hà Nội",
                catHoi,
                artisanBuiKhanh,
                villageTrucSon,
                List.of(),
                10
        );
    }

    private void seedProductIfNotExists(
            String code,
            String name,
            BigDecimal price,
            String description,
            String material,
            String dimensions,
            String musicalRange,
            String origin,
            Category category,
            Artisan artisan,
            CraftVillage craftVillage,
            List<ProductMedia> mediaList,
            int stockQuantity
    ) {
        var existingOpt = productRepository.findByCodeIgnoreCase(code);
        if (existingOpt.isPresent()) {
            Product existing = existingOpt.get();
            boolean needsUpdate = existing.getMedia().size() != mediaList.size();
            if (!needsUpdate) {
                for (int i = 0; i < mediaList.size(); i++) {
                    if (!existing.getMedia().get(i).getUrl().equals(mediaList.get(i).getUrl())) {
                        needsUpdate = true;
                        break;
                    }
                }
            }
            if (needsUpdate) {
                existing.getMedia().clear();
                for (ProductMedia m : mediaList) {
                    m.setProduct(existing);
                    existing.getMedia().add(m);
                }
                productRepository.save(existing);
                log.info("Synchronized media for existing product: [{}] (Total media: {})", code, existing.getMedia().size());
            }
            return;
        }

        Product product = Product.builder()
                .code(code)
                .name(name)
                .price(price)
                .description(description)
                .material(material)
                .dimensions(dimensions)
                .musicalRange(musicalRange)
                .origin(origin)
                .category(category)
                .artisan(artisan)
                .craftVillage(craftVillage)
                .isActive(true)
                .media(new ArrayList<>())
                .build();

        for (ProductMedia m : mediaList) {
            m.setProduct(product);
            product.getMedia().add(m);
        }

        Product savedProduct = productRepository.save(product);

        Inventory inventory = Inventory.builder()
                .product(savedProduct)
                .quantity(stockQuantity)
                .build();
        inventoryRepository.save(inventory);

        log.info("Seeded product: [{}] {} (Stock: {})", code, name, stockQuantity);
    }

    private void printTestAccountsSummary() {
        String summary = """
                \n========================================================================================
                [M4N DEV & TEST SEED DATA INITIALIZED]
                Default Password: %s
                ----------------------------------------------------------------------------------------
                Role           | Email              | Status   | Full Name
                ----------------------------------------------------------------------------------------
                ADMIN          | admin@m4n.vn       | ACTIVE   | Quản Trị Viên Hệ Thống
                ONLINE_STAFF   | staff@m4n.vn       | ACTIVE   | Nhân Viên Bán Hàng Online
                ONLINE_STAFF   | staff2@m4n.vn      | ACTIVE   | Lê Thu Hà (Online Staff)
                POS_STAFF      | pos@m4n.vn         | ACTIVE   | Nhân Viên Showroom POS
                POS_STAFF      | pos2@m4n.vn        | ACTIVE   | Trần Quốc Bảo (POS Staff)
                CUSTOMER       | customer@m4n.vn    | ACTIVE   | Nguyễn Văn Khách
                CUSTOMER       | customer2@m4n.vn   | ACTIVE   | Trần Thị Mai Phương
                CUSTOMER       | locked@m4n.vn      | LOCKED   | Tài Khoản Bị Khóa (Testing 403)
                ========================================================================================
                """.formatted(defaultPassword);
        log.info("{}", summary);
    }
}
