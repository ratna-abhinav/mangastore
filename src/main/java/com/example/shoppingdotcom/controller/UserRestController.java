package com.example.shoppingdotcom.controller;

import com.example.shoppingdotcom.dto.CartDto;
import com.example.shoppingdotcom.dto.CartItemDto;
import com.example.shoppingdotcom.dto.OrderDto;
import com.example.shoppingdotcom.model.*;
import com.example.shoppingdotcom.service.*;
import com.example.shoppingdotcom.util.CommonUtils;
import com.example.shoppingdotcom.util.OrderStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserRestController {

    private static final double CHECKOUT_FEES = 100 + 50;

    @Autowired
    private UserService userService;

    @Autowired
    private CartService cartService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductService productService;

    @Autowired
    private CommonUtils commonUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Users currentUser(Principal principal) {
        return userService.getUserByEmail(principal.getName());
    }

    @GetMapping("/cart")
    public ResponseEntity<CartDto> cart(Principal principal) {
        List<CartItem> items = cartService.getCartsByUser(currentUser(principal).getId());
        List<CartItemDto> itemDtos = items.stream()
                .map(c -> new CartItemDto(c.getId(), c.getProduct().getId(), c.getProduct().getTitle(),
                        c.getProduct().getImage(), c.getProduct().getPrice(), c.getProduct().getDiscountedPrice(),
                        c.getQuantity(), c.getProduct().getStock(), c.getTotalPrice()))
                .toList();
        Double totalOrderPrice = itemDtos.isEmpty() ? 0.0 : items.get(items.size() - 1).getTotalOrderPrice();
        return ResponseEntity.ok(new CartDto(itemDtos, totalOrderPrice));
    }

    @PostMapping("/cart/products/{productId}")
    public ResponseEntity<Map<String, Object>> addToCart(@PathVariable Integer productId, Principal principal) {
        Users user = currentUser(principal);
        try {
            CartItem existing = cartService.getCurrentQuantity(productId, user.getId());
            Product product = productService.getProductById(productId);
            if (product == null) {
                return notFound("Product not found");
            }
            if (existing != null && existing.getQuantity() >= product.getStock()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Cannot add more !!"));
            }
            cartService.saveCart(productId, user.getId());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Cannot be added !!"));
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("cartCount", cartService.getCountCart(user.getId()));
        return ResponseEntity.ok(body);
    }

    @PatchMapping("/cart/items/{cartItemId}")
    public ResponseEntity<Map<String, Object>> updateCartItem(@PathVariable Integer cartItemId,
                                                              @RequestParam String action,
                                                              Principal principal) {
        if (!ownsCartItem(cartItemId, principal)) {
            return notFound("Cart item not found");
        }
        String sy = "de".equalsIgnoreCase(action) ? "de" : "in";
        Boolean updated = cartService.updateQuantity(sy, cartItemId);
        if (!updated) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Cannot add more !!"));
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/cart/items/{cartItemId}")
    public ResponseEntity<Map<String, Object>> removeCartItem(@PathVariable Integer cartItemId, Principal principal) {
        if (!ownsCartItem(cartItemId, principal)) {
            return notFound("Cart item not found");
        }
        while (cartService.updateQuantity("de", cartItemId)) {
            // decrements until the row is deleted at quantity 0
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/checkout")
    public ResponseEntity<Map<String, Object>> checkout(Principal principal) {
        List<CartItem> carts = cartService.getCartsByUser(currentUser(principal).getId());
        Double orderPrice = carts.isEmpty() ? 0.0 : carts.get(carts.size() - 1).getTotalOrderPrice();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("orderPrice", orderPrice);
        body.put("fees", CHECKOUT_FEES);
        body.put("totalOrderPrice", orderPrice + CHECKOUT_FEES);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/orders")
    public ResponseEntity<Map<String, Object>> placeOrder(@RequestBody OrderRequestDTO request, Principal principal)
            throws Exception {
        Users user = currentUser(principal);
        List<CartItem> carts = cartService.getCartsByUser(user.getId());
        if (carts.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cart is empty !!"));
        }
        orderService.saveOrder(user.getId(), request);
        cartService.resetCart(user.getId());
        return ResponseEntity.ok(Map.of("success", true, "message", "Order placed successfully !!"));
    }

    @GetMapping("/orders")
    public ResponseEntity<Map<String, Object>> myOrders(Principal principal) {
        List<ProductOrder> orders = orderService.getOrdersByUser(currentUser(principal).getId());
        double totalSpent = orders.stream()
                .filter(o -> !OrderStatus.CANCELLED.getName().equals(o.getStatus()))
                .mapToDouble(ProductOrder::getPrice)
                .sum();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("orders", orders.stream().map(this::toOrderDto).toList());
        body.put("totalSpent", totalSpent + CHECKOUT_FEES);
        return ResponseEntity.ok(body);
    }

    private static final List<String> CANCELLABLE_STATUSES = List.of(
            OrderStatus.IN_PROGRESS.getName(), OrderStatus.ORDER_RECEIVED.getName());

    @PostMapping("/orders/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(@PathVariable Integer id, Principal principal) {
        Users me = currentUser(principal);
        ProductOrder target = orderService.getOrdersByUser(me.getId()).stream()
                .filter(o -> o.getId().equals(id))
                .findFirst()
                .orElse(null);
        if (target == null) {
            return notFound("Order not found");
        }
        if (OrderStatus.CANCELLED.getName().equals(target.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Order is already cancelled !!"));
        }
        if (!CANCELLABLE_STATUSES.contains(target.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "This order can no longer be cancelled !!"));
        }
        ProductOrder order = orderService.updateOrderStatus(id, OrderStatus.CANCELLED.getName());
        try {
            commonUtils.sendMailForProductOrder(order, OrderStatus.CANCELLED.getName());
        } catch (Exception ignored) {
            // mail failure must not block cancellation
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Order cancelled !!"));
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> profile(Principal principal) {
        Users u = currentUser(principal);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", u.getId());
        body.put("name", u.getName());
        body.put("email", u.getEmail());
        body.put("mobileNumber", u.getMobileNumber());
        body.put("address", u.getAddress());
        body.put("city", u.getCity());
        body.put("state", u.getState());
        body.put("pincode", u.getPincode());
        body.put("profileImage", u.getProfileImage());
        return ResponseEntity.ok(body);
    }

    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String mobileNumber,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String pincode,
            @RequestParam(required = false) MultipartFile img,
            Principal principal) throws IOException {

        Users sessionUser = currentUser(principal);
        Users payload = new Users();
        payload.setId(sessionUser.getId());
        payload.setName(name != null ? name : sessionUser.getName());
        payload.setMobileNumber(mobileNumber != null ? mobileNumber : sessionUser.getMobileNumber());
        payload.setAddress(address != null ? address : sessionUser.getAddress());
        payload.setCity(city != null ? city : sessionUser.getCity());
        payload.setState(state != null ? state : sessionUser.getState());
        payload.setPincode(pincode != null ? pincode : sessionUser.getPincode());

        MultipartFile image = (img != null && !img.isEmpty()) ? img : null;
        Users updated = userService.updateUserProfile(payload, image == null ? emptyFile() : img);
        if (updated == null) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Profile not updated !! Internal Server Error !!"));
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Profile Updated !!",
                "profileImage", updated.getProfileImage() == null ? "" : updated.getProfileImage()));
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody Map<String, String> body, Principal principal) {
        Users user = currentUser(principal);
        boolean matches = passwordEncoder.matches(body.get("currentPassword"), user.getPassword());
        if (!matches) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Incorrect Current Password"));
        }
        user.setPassword(passwordEncoder.encode(body.get("newPassword")));
        userService.updateUser(user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Password Updated successfully !!"));
    }

    private OrderDto toOrderDto(ProductOrder o) {
        return new OrderDto(o.getId(), o.getOrderId(), o.getOrderDate(), o.getProduct().getTitle(),
                o.getProduct().getImage(), o.getPrice(), o.getQuantity(), o.getStatus(), o.getPaymentType());
    }

    private boolean ownsCartItem(Integer cartItemId, Principal principal) {
        Users user = currentUser(principal);
        return cartService.getCartsByUser(user.getId()).stream()
                .anyMatch(c -> c.getId().equals(cartItemId));
    }

    private ResponseEntity<Map<String, Object>> notFound(String message) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", message));
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
