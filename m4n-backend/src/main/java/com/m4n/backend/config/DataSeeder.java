package com.m4n.backend.config;

import com.m4n.backend.entity.Artisan;
import com.m4n.backend.entity.Category;
import com.m4n.backend.entity.CraftVillage;
import com.m4n.backend.entity.Inventory;
import com.m4n.backend.entity.MediaType;
import com.m4n.backend.entity.Order;
import com.m4n.backend.entity.OrderItem;
import com.m4n.backend.entity.OrderStatus;
import com.m4n.backend.entity.Product;
import com.m4n.backend.entity.ProductMedia;
import com.m4n.backend.entity.Role;
import com.m4n.backend.entity.RoleName;
import com.m4n.backend.entity.User;
import com.m4n.backend.entity.Voucher;
import com.m4n.backend.repository.ArtisanRepository;
import com.m4n.backend.repository.CategoryRepository;
import com.m4n.backend.repository.CraftVillageRepository;
import com.m4n.backend.repository.InventoryRepository;
import com.m4n.backend.repository.OrderRepository;
import com.m4n.backend.repository.ProductRepository;
import com.m4n.backend.repository.RoleRepository;
import com.m4n.backend.repository.UserRepository;
import com.m4n.backend.repository.VoucherRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Seed data runner for development and testing environments.
 * Idempotently initializes default roles, products, dev accounts, and sample orders.
 */
@Slf4j
@Component
@org.springframework.core.annotation.Order(0)
public class DataSeeder implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CategoryRepository categoryRepository;
    private final CraftVillageRepository craftVillageRepository;
    private final ArtisanRepository artisanRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final OrderRepository orderRepository;
    private final VoucherRepository voucherRepository;

    @Value("${m4n.seed.dev-accounts:false}")
    private boolean seedDevAccounts;

    @Value("${M4N_DEFAULT_TEST_PASSWORD:}")
    private String defaultPassword;

    public DataSeeder(
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            CategoryRepository categoryRepository,
            CraftVillageRepository craftVillageRepository,
            ArtisanRepository artisanRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            OrderRepository orderRepository,
            VoucherRepository voucherRepository
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.categoryRepository = categoryRepository;
        this.craftVillageRepository = craftVillageRepository;
        this.artisanRepository = artisanRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.orderRepository = orderRepository;
        this.voucherRepository = voucherRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initRoles();
        if (seedDevAccounts) {
            if (defaultPassword.isBlank()) {
                throw new IllegalStateException("M4N_DEFAULT_TEST_PASSWORD must be configured when development seeding is enabled.");
            }
            initProducts();
            initVouchers();
            initDevAccounts();
            initOrders();
            printTestAccountsSummary();
        }
    }

    private void initRoles() {
        for (RoleName roleName : RoleName.values()) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                String description = switch (roleName) {
                    case SUPER_ADMIN -> "Quản trị viên cấp cao nhất hệ thống M4N";
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

    private void initVouchers() {
        seedVoucherIfNotExists(
                "M4N10",
                new BigDecimal("0.1000"),
                new BigDecimal("1000000.00"),
                "Giảm 10% cho đơn hàng nhạc cụ từ 1.000.000₫"
        );
        seedVoucherIfNotExists(
                "DIENM4N",
                new BigDecimal("0.0500"),
                new BigDecimal("500000.00"),
                "Giảm 5% cho đơn hàng từ 500.000₫"
        );
        seedVoucherIfNotExists(
                "VIPM4N",
                new BigDecimal("0.1500"),
                new BigDecimal("5000000.00"),
                "Ưu đãi di sản giảm 15% cho đơn hàng từ 5.000.000₫"
        );
    }

    private void seedVoucherIfNotExists(String code, BigDecimal rate, BigDecimal minOrder, String description) {
        if (voucherRepository.findByCodeIgnoreCase(code).isEmpty()) {
            Voucher voucher = Voucher.builder()
                    .code(code)
                    .discountRate(rate)
                    .minimumOrderValue(minOrder)
                    .isActive(true)
                    .description(description)
                    .build();
            voucherRepository.save(voucher);
            log.info("Initialized seed voucher: {}", code);
        }
    }

    private void initDevAccounts() {
        // 0. Quản trị viên cấp cao nhất (SUPER_ADMIN)
        seedAccountIfNotExists(
                "superadmin@m4n.vn",
                defaultPassword,
                "Lê Quản Trị Cấp Cao (Super Admin)",
                "0900000099",
                "01 Hoàng Thành Thăng Long, Ba Đình, Hà Nội",
                RoleName.SUPER_ADMIN,
                true
        );

        // 1. Quản trị viên chính (ADMIN)
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
        Artisan artisanQuy = upsertSeedArtisan(
                "Nghệ nhân Nguyễn Văn Quý",
                "Nghệ nhân Đào Văn Soạn",
                "Nghệ nhân Ưu tú Đào Văn Soạn thuộc gia đình bốn đời làm đàn tại làng Đào Xá. Ông có hơn 50 năm gắn bó với nghề và dành nhiều tâm huyết truyền dạy kỹ thuật chế tác nhạc cụ dân tộc.",
                "https://cdnphoto.dantri.com.vn/rXJUZum4ZizngoqSIdYqaUXfonk%3D/2020/10/11/8-nghe-nhan-dao-soan-lam-dan-dan-toc-1602355642451.jpg",
                villageDaoXa
        );

        Artisan artisanKhanh = upsertSeedArtisan(
                "Nghệ nhân Phạm Chí Khánh",
                "NSƯT Phạm Chí Khánh",
                "NSƯT Phạm Chí Khánh có hơn 50 năm gắn bó với việc biểu diễn, sưu tầm và chế tác nhạc cụ dân tộc. Không gian làm nghề tại phố Hàng Nón lưu giữ khoảng 150 loại nhạc cụ truyền thống.",
                "https://giadinh.mediacdn.vn/296230595582509056/2024/12/31/picture1-17356365726781973154359.png",
                null
        );

        Artisan artisanPhong = upsertSeedArtisan(
                "Nghệ nhân Trần Văn Phong",
                "Nghệ nhân Đào Anh Tuấn",
                "Nghệ nhân Đào Anh Tuấn là con trai Nghệ nhân Ưu tú Đào Văn Soạn và tiếp nối nghề làm đàn của gia đình tại Đào Xá. Anh chế tác thủ công nhiều loại đàn, trong đó có đàn tranh và đàn nguyệt.",
                "https://nhn.1cdn.vn/2023/08/17/img_0025.jpg",
                villageDaoXa
        );

        Artisan artisanBuiKhanh = upsertSeedArtisan(
                "Nghệ nhân Bùi Quốc Khánh",
                "Nghệ nhân Nguyễn Văn Mão",
                "Nghệ nhân Nguyễn Văn Mão, còn được biết đến với tên Mão Mèo, bắt đầu học thổi sáo từ năm 8 tuổi và tự nghiên cứu chế tác sáo trúc. Anh sáng lập thương hiệu Sáo Trúc Mão Mèo và xây dựng cộng đồng dành cho người yêu sáo.",
                "https://saotrucmaomeo.com/cms/static/site/sale_saotrucmaomeo/uploads/ckeditor/plugin_ckeditor_upload.upload.b120c3a0754a9cd8.4dc3a36f204dc3a86f2e4a5047.JPG",
                null
        );
        if ("https://www.thbt.vn/wp-content/uploads/2026/08/doanh-nhan-nguyen-van-mao-sao-truc-mao-meo-461977.webp"
                .equals(artisanBuiKhanh.getAvatarUrl())) {
            artisanBuiKhanh.setAvatarUrl("https://saotrucmaomeo.com/cms/static/site/sale_saotrucmaomeo/uploads/ckeditor/plugin_ckeditor_upload.upload.b120c3a0754a9cd8.4dc3a36f204dc3a86f2e4a5047.JPG");
            artisanBuiKhanh.setCraftVillage(null);
            artisanBuiKhanh = artisanRepository.save(artisanBuiKhanh);
            log.info("Migrated verified photograph and origin for artisan: {}", artisanBuiKhanh.getName());
        }

        // Keep one catalogue shared by development startup and the reviewed deployment import.
        var categories = java.util.Map.of("DAY", catDay, "HOI", catHoi, "GO", catGo);
        for (CatalogProduct seed : catalogProducts()) {
            Artisan artisan = switch (seed.code()) {
                case "TRN-001" -> artisanQuy;
                case "BAU-001" -> artisanKhanh;
                case "NGU-001" -> artisanPhong;
                case "SAO-001", "TIEU-001" -> artisanBuiKhanh;
                default -> null;
            };
            CraftVillage village = switch (seed.code()) {
                case "TRN-001", "BAU-001", "NGU-001" -> villageDaoXa;
                case "SAO-001", "TIEU-001" -> villageTrucSon;
                default -> null;
            };
            seedProductIfNotExists(seed, categories.get(seed.category()), artisan, village);
        }
    }

    record CatalogProduct(String code, String name, String category, String price, String weightKg,
            int stock, String description, String material, String dimensions, String musicalRange,
            String origin, String image, String alt) { }

    static CatalogProduct[] catalogProducts() {
        try (var input = new org.springframework.core.io.ClassPathResource("seed/catalog.json").getInputStream()) {
            return tools.jackson.databind.json.JsonMapper.builder().build().readValue(input, CatalogProduct[].class);
        } catch (java.io.IOException ex) {
            throw new IllegalStateException("Cannot read the bundled instrument catalogue.", ex);
        }
    }

    private Artisan upsertSeedArtisan(
            String legacyName,
            String name,
            String biography,
            String avatarUrl,
            CraftVillage craftVillage
    ) {
        var verifiedArtisan = artisanRepository.findByNameIgnoreCase(name);
        if (verifiedArtisan.isPresent()) {
            return verifiedArtisan.get();
        }

        Artisan artisan = artisanRepository.findByNameIgnoreCase(legacyName)
                .orElseGet(Artisan::new);

        artisan.setName(name);
        artisan.setBiography(biography);
        artisan.setAvatarUrl(avatarUrl);
        artisan.setCraftVillage(craftVillage);

        Artisan saved = artisanRepository.save(artisan);
        log.info("Seeded verified artisan profile: {}", name);
        return saved;
    }

    private void seedProductIfNotExists(CatalogProduct seed, Category category,
            Artisan artisan, CraftVillage craftVillage) {
        if (productRepository.findByCodeIgnoreCase(seed.code()).isPresent()) return;

        Product product = Product.builder()
                .code(seed.code()).barcode(deriveBarcode(seed.code())).name(seed.name())
                .price(new BigDecimal(seed.price())).billableWeightKg(new BigDecimal(seed.weightKg()))
                .description(seed.description()).material(seed.material()).dimensions(seed.dimensions())
                .musicalRange(seed.musicalRange()).origin(seed.origin()).category(category)
                .artisan(artisan).craftVillage(craftVillage).isActive(true).media(new ArrayList<>()).build();
        product.getMedia().add(ProductMedia.builder().product(product).mediaType(MediaType.IMAGE)
                .url("/assets/images/" + seed.image()).altText(seed.alt()).sortOrder(1).build());
        Product savedProduct = productRepository.save(product);
        inventoryRepository.save(Inventory.builder().product(savedProduct).quantity(seed.stock()).build());
        log.info("Seeded product: [{}] {}", seed.code(), seed.name());
    }

    private String deriveBarcode(String code) {
        return switch (code) {
            case "TRN-001" -> "8938500000018";
            case "BAU-001" -> "8938500000025";
            case "NGU-001" -> "8938500000032";
            case "SAO-001" -> "8938500000049";
            default -> code;
        };
    }

    private void initOrders() {
        if (orderRepository.count() > 0) {
            return;
        }

        var customerOpt = userRepository.findByEmailIgnoreCase("customer@m4n.vn");
        User customer = customerOpt.orElse(null);

        var pTranh = productRepository.findByCodeIgnoreCase("TRN-001").orElse(null);
        var pBau = productRepository.findByCodeIgnoreCase("BAU-001").orElse(null);
        var pNguyet = productRepository.findByCodeIgnoreCase("NGU-001").orElse(null);
        var pSao = productRepository.findByCodeIgnoreCase("SAO-001").orElse(null);
        var pTieu = productRepository.findByCodeIgnoreCase("TIEU-001").orElse(null);

        if (pTranh == null || pBau == null || pNguyet == null || pSao == null || pTieu == null) {
            log.warn("Cannot seed orders because products are missing.");
            return;
        }

        Instant now = Instant.now();

        // 1. Completed order 1 (today)
        seedOrder(
                "M4N-2026-089",
                customer,
                "Trần Hoài Nam",
                "0912 345 678",
                "nam.tran@gmail.com",
                "Số 45 Tràng Tiền, Hoàn Kiếm, Hà Nội",
                OrderStatus.COMPLETED,
                "COD",
                true,
                "Yêu cầu khắc tên nghệ nhân lên thành đàn.",
                now.minus(4, ChronoUnit.HOURS),
                List.of(new SeedItem(pTranh, 1, pTranh.getPrice()))
        );

        // 2. Completed order 2 (yesterday)
        seedOrder(
                "M4N-2026-088",
                customer,
                "Lê Thuỳ Dung",
                "0988 765 432",
                "thuydung.le@outlook.com",
                "228 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
                OrderStatus.COMPLETED,
                "COD",
                true,
                "Đóng gói hộp chống sốc chuyên dụng.",
                now.minus(1, ChronoUnit.DAYS),
                List.of(
                        new SeedItem(pBau, 1, pBau.getPrice()),
                        new SeedItem(pSao, 2, pSao.getPrice())
                )
        );

        // 3. Completed order 3 (5 days ago)
        seedOrder(
                "M4N-2026-087",
                customer,
                "Nguyễn Văn Khách",
                "0900000004",
                "customer@m4n.vn",
                "68 Đường Lê Lợi, TP. Huế",
                OrderStatus.COMPLETED,
                "COD",
                true,
                "Giao giờ hành chính.",
                now.minus(5, ChronoUnit.DAYS),
                List.of(new SeedItem(pNguyet, 1, pNguyet.getPrice()))
        );

        // 4. Confirmed order 4 (2 days ago)
        seedOrder(
                "M4N-2026-086",
                customer,
                "Hoàng Minh Quân",
                "0933 112 233",
                "quan.hm@gmail.com",
                "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
                OrderStatus.CONFIRMED,
                "COD",
                false,
                "Đã kiểm tra kho và xác nhận xuất xưởng.",
                now.minus(2, ChronoUnit.DAYS),
                List.of(new SeedItem(pTranh, 1, pTranh.getPrice()))
        );

        // 5. Pending confirmation order 5 (today)
        seedOrder(
                "M4N-2026-085",
                customer,
                "Vũ Thị Bích",
                "0977 889 900",
                "bich.vu@gmail.com",
                "15 Trần Phú, Ba Đình, Hà Nội",
                OrderStatus.PENDING_CONFIRMATION,
                "COD",
                false,
                "Chờ nhân viên liên hệ xác nhận đơn.",
                now.minus(1, ChronoUnit.HOURS),
                List.of(new SeedItem(pTieu, 2, pTieu.getPrice()))
        );

        // 6. Out of stock waiting order 6 (3 days ago)
        seedOrder(
                "M4N-2026-084",
                customer,
                "Đặng Hải Long",
                "0911 223 344",
                "long.dh@gmail.com",
                "34 Hai Bà Trưng, Đà Nẵng",
                OrderStatus.OUT_OF_STOCK_WAITING,
                "COD",
                false,
                "Khách đồng ý đợi xưởng Đào Xá hoàn thiện đợt mới.",
                now.minus(3, ChronoUnit.DAYS),
                List.of(new SeedItem(pBau, 1, pBau.getPrice()))
        );

        // 7. Cancelled order 7 (4 days ago)
        seedOrder(
                "M4N-2026-083",
                customer,
                "Phạm Đức Anh",
                "0944 556 677",
                "ducanh.pham@gmail.com",
                "89 Cầu Giấy, Hà Nội",
                OrderStatus.CANCELLED,
                "COD",
                false,
                "Khách đổi ý đặt mẫu khác.",
                now.minus(4, ChronoUnit.DAYS),
                List.of(new SeedItem(pSao, 1, pSao.getPrice()))
        );

        // 8. Completed order from previous period
        seedOrder(
                "M4N-2026-070",
                customer,
                "Trần Thị Mai Phương",
                "0987654321",
                "customer2@m4n.vn",
                "45 Phố Hàng Gai, Hoàn Kiếm, Hà Nội",
                OrderStatus.COMPLETED,
                "COD",
                true,
                "Đơn hàng hoàn tất tháng trước.",
                now.minus(35, ChronoUnit.DAYS),
                List.of(
                        new SeedItem(pTranh, 1, pTranh.getPrice()),
                        new SeedItem(pNguyet, 1, pNguyet.getPrice())
                )
        );

        log.info("Initialized sample orders for Admin Dashboard.");
    }

    private record SeedItem(Product product, int quantity, BigDecimal price) {}

    private void seedOrder(
            String code,
            User user,
            String customerName,
            String customerPhone,
            String customerEmail,
            String address,
            OrderStatus status,
            String paymentMethod,
            boolean isPaid,
            String notes,
            Instant createdAt,
            List<SeedItem> items
    ) {
        BigDecimal total = BigDecimal.ZERO;
        for (SeedItem it : items) {
            total = total.add(it.price().multiply(BigDecimal.valueOf(it.quantity())));
        }

        Order order = Order.builder()
                .orderCode(code)
                .user(user)
                .customerName(customerName)
                .customerPhone(customerPhone)
                .customerEmail(customerEmail)
                .shippingAddress(address)
                .totalAmount(total)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(total)
                .status(status)
                .paymentMethod(paymentMethod)
                .isPaid(isPaid)
                .notes(notes)
                .createdAt(createdAt)
                .updatedAt(createdAt)
                .items(new ArrayList<>())
                .build();

        for (SeedItem it : items) {
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(it.product())
                    .productName(it.product().getName())
                    .productCode(it.product().getCode())
                    .price(it.price())
                    .quantity(it.quantity())
                    .build();
            order.getItems().add(orderItem);
        }

        orderRepository.save(order);
    }

    private void printTestAccountsSummary() {
        String summary = """
                \n========================================================================================
                [M4N DEV & TEST SEED DATA INITIALIZED]
                ----------------------------------------------------------------------------------------
                Role           | Email              | Status   | Full Name
                ----------------------------------------------------------------------------------------
                SUPER_ADMIN    | superadmin@m4n.vn  | ACTIVE   | Lê Quản Trị Cấp Cao (Super Admin)
                ADMIN          | admin@m4n.vn       | ACTIVE   | Quản Trị Viên Hệ Thống
                ONLINE_STAFF   | staff@m4n.vn       | ACTIVE   | Nhân Viên Bán Hàng Online
                ONLINE_STAFF   | staff2@m4n.vn      | ACTIVE   | Lê Thu Hà (Online Staff)
                POS_STAFF      | pos@m4n.vn         | ACTIVE   | Nhân Viên Showroom POS
                POS_STAFF      | pos2@m4n.vn        | ACTIVE   | Trần Quốc Bảo (POS Staff)
                CUSTOMER       | customer@m4n.vn    | ACTIVE   | Nguyễn Văn Khách
                CUSTOMER       | customer2@m4n.vn   | ACTIVE   | Trần Thị Mai Phương
                CUSTOMER       | locked@m4n.vn      | LOCKED   | Tài Khoản Bị Khóa (Testing 403)
                ========================================================================================
                """;
        log.info("{}", summary);
    }
}
