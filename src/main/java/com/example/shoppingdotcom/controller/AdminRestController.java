package com.example.shoppingdotcom.controller;

import com.example.shoppingdotcom.dto.CategoryDto;
import com.example.shoppingdotcom.dto.OrderDto;
import com.example.shoppingdotcom.dto.PageDto;
import com.example.shoppingdotcom.dto.ProductDto;
import com.example.shoppingdotcom.dto.UserAdminDto;
import com.example.shoppingdotcom.model.Category;
import com.example.shoppingdotcom.model.Product;
import com.example.shoppingdotcom.model.ProductOrder;
import com.example.shoppingdotcom.model.Users;
import com.example.shoppingdotcom.service.CategoryService;
import com.example.shoppingdotcom.service.NeonStorageService;
import com.example.shoppingdotcom.service.OrderService;
import com.example.shoppingdotcom.service.ProductService;
import com.example.shoppingdotcom.service.UserService;
import com.example.shoppingdotcom.util.AppConstants;
import com.example.shoppingdotcom.util.CommonUtils;
import com.example.shoppingdotcom.util.OrderStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/admin")
public class AdminRestController {

    @Autowired
    private ProductService productService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private UserService userService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private NeonStorageService neonStorageService;

    @Autowired
    private CommonUtils commonUtils;

    // ------------------------------------------------------------ dashboard

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("products", productService.getAllProducts().size());
        body.put("categories", categoryService.getAllCategory().size());
        body.put("users", userService.getUsers("ROLE_USER").size());
        body.put("admins", userService.getUsers("ROLE_ADMIN").size());
        body.put("orders", orderService.getAllOrders().size());
        return ResponseEntity.ok(body);
    }

    // ------------------------------------------------------------ categories

    @GetMapping("/categories")
    public ResponseEntity<PageDto<CategoryDto>> categories(
            @RequestParam(name = "pageNo", defaultValue = "0") Integer pageNo,
            @RequestParam(name = "pageSize", defaultValue = "10") Integer pageSize) {
        Page<Category> page = categoryService.getAllCategoryPagination(pageNo, pageSize);
        return ResponseEntity.ok(toPage(page.getContent().stream().map(CategoryDto::from).toList(),
                page, pageSize));
    }

    @GetMapping("/categories-all")
    public ResponseEntity<List<CategoryDto>> allCategories() {
        return ResponseEntity.ok(categoryService.getAllCategory().stream()
                .sorted(Comparator.comparing(Category::getId))
                .map(CategoryDto::from)
                .toList());
    }

    @PostMapping(value = "/categories", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> saveCategory(
            @RequestParam String name,
            @RequestParam(required = false) MultipartFile file) throws IOException {

        if (categoryService.existsCategory(name)) {
            return conflict("Category name already exists");
        }

        Category category = new Category();
        category.setName(name);
        category.setIsActive(1);
        category.setImageName(AppConstants.DEFAULT_IMAGE_URL);

        Category saved = categoryService.saveCategory(category);
        if (!ObjectUtils.isEmpty(saved) && file != null && !file.isEmpty()) {
            saved.setImageName(neonStorageService.uploadFile("categories", file));
            saved = categoryService.saveCategory(saved);
        }
        if (ObjectUtils.isEmpty(saved)) {
            return internalError("Category not saved! Internal server error");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("success", true, "category", CategoryDto.from(saved)));
    }

    @PutMapping(value = "/categories/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> updateCategory(
            @PathVariable Integer id,
            @RequestParam String name,
            @RequestParam Integer isActive,
            @RequestParam(required = false) MultipartFile file) throws IOException {

        Category prev = categoryService.getCategoryById(id);
        if (ObjectUtils.isEmpty(prev)) {
            return notFound("Category not found");
        }

        prev.setName(name);
        prev.setIsActive(isActive);

        if (isActive == 0) {
            List<Product> products = productService.getProductsByCategory(prev.getName());
            for (Product p : products) {
                p.setIsActive(0);
                productService.saveProduct(p);
            }
        }
        if (prev.getImageName() == null || prev.getImageName().isEmpty()) {
            prev.setImageName(AppConstants.DEFAULT_IMAGE_URL);
        }
        Category updated = categoryService.saveCategory(prev);
        if (!ObjectUtils.isEmpty(updated) && file != null && !file.isEmpty()) {
            updated.setImageName(neonStorageService.uploadFile("categories", file));
            updated = categoryService.saveCategory(updated);
        }
        return ResponseEntity.ok(Map.of("success", true, "category", CategoryDto.from(updated)));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Map<String, Object>> deleteCategory(@PathVariable Integer id) {
        Category category = categoryService.getCategoryById(id);
        if (ObjectUtils.isEmpty(category)) {
            return notFound("Category not found");
        }
        Boolean deleted = categoryService.deleteCategory(id);
        return deleted
                ? ok("Category deleted successfully !!")
                : internalError("Category not deleted! Internal server error");
    }

    // ------------------------------------------------------------ products

    @GetMapping("/products")
    public ResponseEntity<PageDto<ProductDto>> products(
            @RequestParam(name = "keyword", defaultValue = "") String keyword,
            @RequestParam(name = "pageNo", defaultValue = "0") Integer pageNo,
            @RequestParam(name = "pageSize", defaultValue = "10") Integer pageSize) {

        Page<Product> page = (keyword != null && !keyword.isBlank())
                ? productService.searchProductAdminPagination(pageNo, pageSize, keyword.trim())
                : productService.getAllProductsPagination(pageNo, pageSize);
        return ResponseEntity.ok(toPage(page.getContent().stream().map(ProductDto::from).toList(),
                page, pageSize));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Map<String, Object>> deleteProduct(@PathVariable Integer id) {
        try {
            Boolean deleted = productService.deleteProduct(id);
            return deleted
                    ? ok("Product successfully deleted")
                    : notFound("Product not found");
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error",
                    "Cannot delete: this product is referenced by orders or cart items"));
        }
    }

    @PostMapping(value = "/products", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> saveProduct(
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam String category,
            @RequestParam Double price,
            @RequestParam Integer stock,
            @RequestParam(required = false) Integer discount,
            @RequestParam(defaultValue = "1") Integer isActive,
            @RequestParam(required = false) MultipartFile file) throws IOException {

        Product product = new Product();
        product.setTitle(title);
        product.setDescription(description);
        product.setCategory(category);
        product.setPrice(price);
        product.setStock(stock);
        product.setImage(AppConstants.DEFAULT_IMAGE_URL);
        product.setDiscount(discount == null ? 0 : discount);
        product.setDiscountedPrice(price - price * product.getDiscount() / 100.0);
        product.setIsActive(isActive);

        applyInactiveCategoryRule(product);

        Product saved = productService.saveProduct(product);
        if (ObjectUtils.isEmpty(saved)) {
            return internalError("Product not saved! Internal Server error");
        }
        if (file != null && !file.isEmpty()) {
            saved.setImage(neonStorageService.uploadFile("products", file));
            saved = productService.saveProduct(saved);
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("success", true, "product", ProductDto.from(saved)));
    }

    @PutMapping(value = "/products/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> updateProduct(
            @PathVariable Integer id,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam String category,
            @RequestParam Double price,
            @RequestParam Integer stock,
            @RequestParam Integer discount,
            @RequestParam Integer isActive,
            @RequestParam(required = false) MultipartFile file) throws IOException {

        if (discount < 0 || discount > 100) {
            return ResponseEntity.badRequest().body(Map.of("error", "invalid Discount!"));
        }

        Product payload = new Product();
        payload.setId(id);
        payload.setTitle(title);
        payload.setDescription(description);
        payload.setCategory(category);
        payload.setPrice(price);
        payload.setStock(stock);
        payload.setDiscount(discount);
        payload.setIsActive(isActive);

        applyInactiveCategoryRule(payload);

        Product updated = productService.updateProduct(payload, file == null ? emptyFile() : file);
        if (ObjectUtils.isEmpty(updated)) {
            return internalError("Product not updated! Internal server error");
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    private void applyInactiveCategoryRule(Product product) {
        boolean activeCategory = categoryService.getAllActiveCategory().stream()
                .anyMatch(c -> Objects.equals(c.getName(), product.getCategory()));
        if (!activeCategory && product.getIsActive() == 1) {
            product.setIsActive(0);
        }
    }

    // ------------------------------------------------------------ orders

    @GetMapping("/orders")
    public ResponseEntity<Map<String, Object>> orders(
            @RequestParam(name = "orderId", defaultValue = "") String orderId,
            @RequestParam(name = "pageNo", defaultValue = "0") Integer pageNo,
            @RequestParam(name = "pageSize", defaultValue = "10") Integer pageSize) {

        Map<String, Object> body = new LinkedHashMap<>();
        if (orderId != null && !orderId.isBlank()) {
            ProductOrder curOrder = orderService.getOrdersByOrderId(orderId.trim());
            body.put("orders", ObjectUtils.isEmpty(curOrder) ? List.of() : List.of(toDto(curOrder)));
            body.put("totalElements", ObjectUtils.isEmpty(curOrder) ? 0 : 1);
        } else {
            Page<ProductOrder> page = orderService.getAllOrdersPagination(pageNo, pageSize);
            body.put("orders", page.getContent().stream().map(this::toDto).toList());
            body.put("totalElements", page.getTotalElements());
            body.put("pageNo", page.getNumber());
            body.put("totalPages", page.getTotalPages());
        }
        return ResponseEntity.ok(body);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(@PathVariable Integer id,
                                                                 @RequestBody Map<String, Integer> body) {
        Integer st = body.get("st");
        String status = null;
        for (OrderStatus s : OrderStatus.values()) {
            if (s.getId().equals(st)) {
                status = s.getName();
            }
        }
        if (status == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unknown status"));
        }
        ProductOrder updated = orderService.updateOrderStatus(id, status);
        if (ObjectUtils.isEmpty(updated)) {
            return notFound("Order not found");
        }
        commonUtils.sendMailForProductOrderAsync(updated, status);
        return ResponseEntity.ok(Map.of("success", true, "message", "Order Status Updated !!",
                "status", updated.getStatus()));
    }

    // ------------------------------------------------------------ users & admins

    @GetMapping("/users")
    public ResponseEntity<List<UserAdminDto>> users(@RequestParam Integer type) {
        String role = type == 1 ? "ROLE_USER" : "ROLE_ADMIN";
        return ResponseEntity.ok(userService.getUsers(role).stream()
                .sorted(Comparator.comparing(Users::getId))
                .map(UserAdminDto::from)
                .toList());
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<Map<String, Object>> updateUserStatus(@PathVariable Integer id,
                                                                @RequestBody Map<String, Boolean> body) {
        Boolean result = userService.updateAccountStatus(id, Boolean.TRUE.equals(body.get("enabled")));
        return result
                ? ok("Account Status Updated")
                : internalError("Account status not updated! Internal Server Error");
    }

    @PostMapping(value = "/admins", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> addAdmin(
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam String mobileNumber,
            @RequestParam String password,
            @RequestParam(required = false) MultipartFile img) throws IOException {

        if (userService.existsEmail(email)) {
            return conflict("Email already exists !!");
        }

        Users admin = new Users();
        admin.setName(name);
        admin.setEmail(email);
        admin.setMobileNumber(mobileNumber);
        admin.setPassword(password);

        // resolve final avatar BEFORE saving: saveAdmin encodes the password,
        // so calling it twice would double-hash and lock the account out
        if (img != null && !img.isEmpty()) {
            admin.setProfileImage(neonStorageService.uploadFile("profiles", img));
        } else {
            admin.setProfileImage(AppConstants.DEFAULT_IMAGE_URL);
        }

        Users saved = userService.saveAdmin(admin);
        if (ObjectUtils.isEmpty(saved)) {
            return internalError("Admin not registered !! Internal Server Error");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true, "email", email));
    }

    // ------------------------------------------------------------ helpers

    private OrderDto toDto(ProductOrder o) {
        return new OrderDto(o.getId(), o.getOrderId(), o.getOrderDate(), o.getProduct().getTitle(),
                o.getProduct().getImage(), o.getPrice(), o.getQuantity(), o.getStatus(), o.getPaymentType());
    }

    private <T> PageDto<T> toPage(List<T> content, Page<?> page, int pageSize) {
        return new PageDto<>(content, page.getNumber(), pageSize,
                page.getTotalElements(), page.getTotalPages(), page.isFirst(), page.isLast());
    }

    private ResponseEntity<Map<String, Object>> ok(String message) {
        return ResponseEntity.ok(Map.of("success", true, "message", message));
    }

    private ResponseEntity<Map<String, Object>> conflict(String message) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", message));
    }

    private ResponseEntity<Map<String, Object>> notFound(String message) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", message));
    }

    private ResponseEntity<Map<String, Object>> internalError(String message) {
        return ResponseEntity.internalServerError().body(Map.of("error", message));
    }

    private MultipartFile emptyFile() {
        return new MultipartFile() {
            @Override public String getName() { return ""; }
            @Override public String getOriginalFilename() { return ""; }
            @Override public String getContentType() { return null; }
            @Override public boolean isEmpty() { return true; }
            @Override public long getSize() { return 0; }
            @Override public byte[] getBytes() { return new byte[0]; }
            @Override public java.io.InputStream getInputStream() { return new java.io.ByteArrayInputStream(new byte[0]); }
            @Override public void transferTo(java.io.File dest) { }
        };
    }
}
